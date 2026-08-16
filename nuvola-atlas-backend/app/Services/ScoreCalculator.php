<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\ZoneScoreUpdated;
use App\Models\MethodologyVersion;
use App\Models\Zone;
use App\Models\ZoneScoreSnapshot;
use Illuminate\Support\Facades\Cache;

/**
 * Vitality Score engine — 4 pillars, 13 indicators.
 *
 * Rules (PHASES.md, §Scoring Engine Logic):
 * - Every indicator is a 0-100 normalized value or NULL ("Awaiting data").
 * - Pillar score = simple average of the pillar's non-null indicators.
 * - Composite score = weighted mean of the pillars that have at least one
 *   non-null indicator, with the weights renormalized across the pillars
 *   actually present (a fully-missing pillar is skipped too — you cannot
 *   score against an empty pillar).
 * - Missing indicators are excluded from the average; they are NEVER
 *   treated as zero. That was the whole point of the July 2026 rewrite —
 *   the previous algorithm collapsed sub-county scores for informal
 *   settlements because Daystar hadn't delivered their indicators yet.
 */
class ScoreCalculator
{
    public const WEIGHTS_CACHE_KEY = 'vitality_weights';

    /**
     * Fallback used before any methodology version is published, and for
     * any pillar the published version leaves out or stores as garbage.
     */
    public const DEFAULT_WEIGHTS = [
        'social' => 0.25,
        'safety' => 0.25,
        'density' => 0.25,
        'infra' => 0.25,
    ];

    /** @var array{social: float, safety: float, density: float, infra: float}|null */
    private ?array $resolvedWeights = null;

    /**
     * Pillar weights for the live methodology, surfaced on
     * /vitality/methodology and applied by `calculateScore`.
     *
     * Read from `methodology_versions WHERE is_current` and cached for 60s;
     * MethodologyPublisher drops the key on publish, so a weight change goes
     * live with the recalculation it triggers rather than a minute later.
     * Held on the instance as well so recalculateAll's 17-zone loop doesn't
     * re-enter the cache once per zone.
     *
     * @return array{social: float, safety: float, density: float, infra: float}
     */
    public function getWeights(): array
    {
        return $this->resolvedWeights ??= Cache::remember(
            self::WEIGHTS_CACHE_KEY,
            60,
            fn () => self::normalizeWeights(MethodologyVersion::current()?->weights),
        );
    }

    /**
     * @param  array<string, mixed>|null  $stored
     * @return array{social: float, safety: float, density: float, infra: float}
     */
    private static function normalizeWeights(?array $stored): array
    {
        if ($stored === null) {
            return self::DEFAULT_WEIGHTS;
        }

        $weights = [];
        foreach (self::DEFAULT_WEIGHTS as $pillar => $fallback) {
            $value = $stored[$pillar] ?? null;
            $weights[$pillar] = is_numeric($value) && (float) $value >= 0
                ? (float) $value
                : $fallback;
        }

        return array_sum($weights) > 0 ? $weights : self::DEFAULT_WEIGHTS;
    }

    /**
     * Slug groupings driving the scoring math. Matches config/methodology.php
     * one-for-one. Duplicated here so the calculator does not depend on
     * loading config in tight loops (~17 zones × hourly cron).
     *
     * @return array<string, array<int, string>>
     */
    public static function pillars(): array
    {
        return [
            'social' => ['healthcare_access', 'education_access', 'digital_connectivity'],
            'safety' => ['crime_rates', 'emergency_response_access', 'disaster_exposure'],
            'density' => ['population_density', 'congestion', 'housing_pressure'],
            'infra' => ['road_quality', 'energy_reliability', 'food_risk', 'waste_management'],
        ];
    }

    /**
     * Compute the four pillar scores for a zone. Any pillar with all
     * indicators null returns null (rendered as "Awaiting data").
     *
     * @return array{social: ?int, safety: ?int, density: ?int, infra: ?int}
     */
    public function pillarScores(Zone $zone): array
    {
        $values = [];
        foreach (self::pillars() as $indicators) {
            foreach ($indicators as $slug) {
                $values[$slug] = $this->indicator($zone, $slug);
            }
        }
        return $this->pillarScoresFromValues($values);
    }

    /**
     * Same as `pillarScores`, but takes a plain indicator-slug → value map.
     * Useful when aggregating snapshot rows (ZoneHistoryController averages
     * indicator columns per bucket and only needs the pillar math).
     *
     * @param array<string, ?int> $values slug (without "indicator_" prefix) → 0-100 value or null
     * @return array{social: ?int, safety: ?int, density: ?int, infra: ?int}
     */
    public function pillarScoresFromValues(array $values): array
    {
        $result = [];
        foreach (self::pillars() as $pillar => $indicators) {
            $result[$pillar] = $this->average(
                array_map(fn (string $ind) => $values[$ind] ?? null, $indicators)
            );
        }
        return $result;
    }

    /**
     * Composite Vitality Score for a zone. Returns null only when every
     * pillar is empty (should never happen in practice — the health check
     * catches fully-empty zones).
     */
    public function calculateScore(Zone $zone): ?int
    {
        return $this->compositeFromPillars($this->pillarScores($zone));
    }

    /**
     * Weighted mean of the pillars that have a score, renormalized over
     * exactly those pillars — a zone missing its safety data is scored on
     * the three it has, not penalised for the one it doesn't.
     *
     * Pass `$weights` to project a score under a proposed vector without
     * touching the live methodology; MethodologyPreview does this so the
     * admin preview and the post-publish recalculation cannot disagree.
     *
     * @param  array{social: ?int, safety: ?int, density: ?int, infra: ?int}  $pillars
     * @param  array<string, float>|null  $weights
     */
    public function compositeFromPillars(array $pillars, ?array $weights = null): ?int
    {
        $weights ??= $this->getWeights();

        $weighted = 0.0;
        $totalWeight = 0.0;
        foreach ($pillars as $pillar => $value) {
            if ($value === null) {
                continue;
            }
            $weight = (float) ($weights[$pillar] ?? 0.0);
            $weighted += $weight * $value;
            $totalWeight += $weight;
        }

        return $totalWeight > 0.0 ? (int) round($weighted / $totalWeight) : null;
    }

    /**
     * List of indicator slugs that have no reading for this zone yet.
     * Drives the "8 of 13 indicators active" UI badge.
     *
     * @return array<int, string>
     */
    public function missingIndicators(Zone $zone): array
    {
        $missing = [];
        foreach (self::pillars() as $indicators) {
            foreach ($indicators as $slug) {
                if ($this->indicator($zone, $slug) === null) {
                    $missing[] = $slug;
                }
            }
        }
        return $missing;
    }

    /**
     * Persist the current score + a snapshot row so the trend chart and
     * forecast endpoint have a continuous per-indicator history.
     */
    public function recalculate(Zone $zone, bool $broadcast = false): void
    {
        $newScore = $this->calculateScore($zone);
        $zone->score = $newScore ?? 0;
        $zone->last_sync_min = 0;
        $zone->save();

        ZoneScoreSnapshot::create(array_merge(
            [
                'zone_id' => $zone->id,
                'captured_at' => now(),
                'score' => $zone->score,
            ],
            $this->indicatorSnapshotColumns($zone),
        ));

        if ($broadcast) {
            event(new ZoneScoreUpdated($zone));
        }
    }

    /**
     * Recalculate scores for all zones.
     *
     * @return int Number of zones recalculated
     */
    public function recalculateAll(bool $broadcast = false): int
    {
        $zones = Zone::all();
        foreach ($zones as $zone) {
            $this->recalculate($zone, $broadcast);
        }
        return $zones->count();
    }

    /**
     * @param array<int, int|null> $values
     */
    private function average(array $values): ?int
    {
        $present = array_values(array_filter($values, fn ($v) => $v !== null));
        if (empty($present)) {
            return null;
        }
        return (int) round(array_sum($present) / count($present));
    }

    /**
     * Read a raw 0-100 indicator value from the zone row. The `indicator_`
     * prefix keeps the storage layer aligned with the config slugs.
     */
    private function indicator(Zone $zone, string $slug): ?int
    {
        $value = $zone->getAttribute('indicator_' . $slug);
        if ($value === null) {
            return null;
        }
        return (int) $value;
    }

    /**
     * Assemble the per-indicator columns for a ZoneScoreSnapshot insert.
     *
     * @return array<string, int|null>
     */
    private function indicatorSnapshotColumns(Zone $zone): array
    {
        $out = [];
        foreach (self::pillars() as $indicators) {
            foreach ($indicators as $slug) {
                $out['indicator_' . $slug] = $this->indicator($zone, $slug);
            }
        }
        return $out;
    }
}
