<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\ZoneScoreUpdated;
use App\Models\Zone;
use App\Models\ZoneScoreSnapshot;

/**
 * Vitality Score engine — 4 equally-weighted pillars, 13 indicators.
 *
 * Rules (PHASES.md, §Scoring Engine Logic):
 * - Every indicator is a 0-100 normalized value or NULL ("Awaiting data").
 * - Pillar score = simple average of the pillar's non-null indicators.
 * - Composite score = simple average of pillars that have at least one
 *   non-null indicator (a fully-missing pillar is skipped too — you cannot
 *   score against an empty pillar).
 * - Missing indicators are excluded from the average; they are NEVER
 *   treated as zero. That was the whole point of the July 2026 rewrite —
 *   the previous algorithm collapsed sub-county scores for informal
 *   settlements because Daystar hadn't delivered their indicators yet.
 */
class ScoreCalculator
{
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
        $result = [];
        foreach (self::pillars() as $pillar => $indicators) {
            $result[$pillar] = $this->average(
                array_map(fn (string $ind) => $this->indicator($zone, $ind), $indicators)
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
        $pillars = array_values($this->pillarScores($zone));
        return $this->average($pillars);
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
