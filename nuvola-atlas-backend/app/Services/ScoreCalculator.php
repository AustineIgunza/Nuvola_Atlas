<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\ZoneScoreUpdated;
use App\Models\MethodologyVersion;
use App\Models\Zone;
use App\Models\ZoneScoreSnapshot;
use App\Support\Pillars;
use Illuminate\Support\Facades\Cache;

/**
 * Composite score engine, over whatever pillars the registry declares live.
 *
 * - Every pillar value is a 0-100 normalized number or NULL ("Awaiting data").
 * - Composite = weighted mean of the pillars that have a value, with the
 *   weights renormalized across exactly those pillars. A sub-county missing
 *   its transit figure is scored on the pillars it has, not penalised for the
 *   one it doesn't.
 * - A missing pillar is NEVER treated as zero. That was the point of the July
 *   2026 rewrite: the previous algorithm collapsed scores for informal
 *   settlements purely because their data had not arrived.
 * - Held pillars carry weight 0, so they surface with their vintage attached
 *   without moving the composite.
 */
class ScoreCalculator
{
    public const WEIGHTS_CACHE_KEY = 'vitality_weights';

    /** @var array<string, float>|null */
    private ?array $resolvedWeights = null;

    /**
     * Fallback used before any methodology version is published, and for any
     * pillar a published version leaves out or stores as garbage.
     *
     * @return array<string, float>
     */
    public static function defaultWeights(): array
    {
        return Pillars::weights();
    }

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
     * @return array<string, float>
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
     * @return array<string, float>
     */
    private static function normalizeWeights(?array $stored): array
    {
        $defaults = self::defaultWeights();
        if ($stored === null) {
            return $defaults;
        }

        $weights = [];
        foreach ($defaults as $pillar => $fallback) {
            $value = $stored[$pillar] ?? null;
            $weights[$pillar] = is_numeric($value) && (float) $value >= 0
                ? (float) $value
                : $fallback;
        }

        return array_sum($weights) > 0 ? $weights : $defaults;
    }

    /**
     * Live pillar keys, in registry order.
     *
     * @return array<int, string>
     */
    public static function pillars(): array
    {
        return Pillars::keys();
    }

    /**
     * Pillar values for a zone. A pillar with no reading returns null and is
     * rendered as "Awaiting data".
     *
     * @return array<string, ?int>
     */
    public function pillarScores(Zone $zone): array
    {
        $values = [];
        foreach (Pillars::keys() as $key) {
            $raw = $zone->getAttribute(Pillars::column($key));
            $values[$key] = $raw === null ? null : (int) $raw;
        }

        return $values;
    }

    /**
     * Same as `pillarScores`, but takes a plain pillar-key → value map.
     * ZoneHistoryController averages the snapshot columns per bucket and only
     * needs the composite math applied to the result.
     *
     * @param  array<string, ?int>  $values
     * @return array<string, ?int>
     */
    public function pillarScoresFromValues(array $values): array
    {
        $result = [];
        foreach (Pillars::keys() as $key) {
            $result[$key] = $values[$key] ?? null;
        }

        return $result;
    }

    /**
     * Composite score for a zone. Null when no pillar has a value.
     */
    public function calculateScore(Zone $zone): ?int
    {
        return $this->compositeFromPillars($this->pillarScores($zone));
    }

    /**
     * Weighted mean of the pillars that have a score, renormalized over
     * exactly those pillars.
     *
     * Pass `$weights` to project a score under a proposed vector without
     * touching the live methodology; MethodologyPreview does this so the admin
     * preview and the post-publish recalculation cannot disagree.
     *
     * @param  array<string, ?int>  $pillars
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
     * Live pillars that have no reading for this zone yet. Drives the
     * "3 of 4 pillars measured" badge.
     *
     * @return array<int, string>
     */
    public function missingPillars(Zone $zone): array
    {
        $missing = [];
        foreach ($this->pillarScores($zone) as $key => $value) {
            if ($value === null) {
                $missing[] = $key;
            }
        }

        return $missing;
    }

    /**
     * Persist the current score plus a snapshot row, so the trend chart and
     * the forecast endpoint have a continuous per-pillar history.
     */
    public function recalculate(Zone $zone, bool $broadcast = false): void
    {
        $zone->score = $this->calculateScore($zone);
        $zone->last_sync_min = 0;
        $zone->save();

        $columns = [];
        foreach ($this->pillarScores($zone) as $key => $value) {
            $columns[Pillars::column($key)] = $value;
        }

        ZoneScoreSnapshot::create(array_merge([
            'zone_id' => $zone->id,
            'captured_at' => now(),
            'score' => $zone->score,
        ], $columns));

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
}
