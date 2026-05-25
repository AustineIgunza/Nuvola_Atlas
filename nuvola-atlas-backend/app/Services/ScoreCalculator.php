<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\ZoneScoreUpdated;
use App\Models\Zone;

class ScoreCalculator
{
    /**
     * Get pillar weights derived from the methodology config.
     * Each pillar's weight = its sub-metric count / total sub-metrics.
     *
     * @return array<string, float>
     */
    public function getWeights(): array
    {
        $pillars = config('methodology', []);
        $total = 0;
        $counts = [];

        foreach ($pillars as $pillar) {
            $count = count($pillar['subMetrics'] ?? []);
            $counts[$pillar['key']] = $count;
            $total += $count;
        }

        if ($total === 0) {
            return ['social' => 0.25, 'safety' => 0.25, 'density' => 0.25, 'infra' => 0.25];
        }

        $weights = [];
        foreach ($counts as $key => $count) {
            $weights[$key] = round($count / $total, 4);
        }

        return $weights;
    }

    /**
     * Calculate the weighted vitality score for a zone.
     */
    public function calculateScore(Zone $zone): int
    {
        $weights = $this->getWeights();

        $score = ($zone->pillar_social * ($weights['social'] ?? 0))
            + ($zone->pillar_safety * ($weights['safety'] ?? 0))
            + ($zone->pillar_density * ($weights['density'] ?? 0))
            + ($zone->pillar_infra * ($weights['infra'] ?? 0));

        return (int) round($score);
    }

    /**
     * Recalculate and persist the score for a single zone.
     */
    public function recalculate(Zone $zone, bool $broadcast = false): void
    {
        $zone->score = $this->calculateScore($zone);
        $zone->last_sync_min = 0;
        $zone->save();

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
