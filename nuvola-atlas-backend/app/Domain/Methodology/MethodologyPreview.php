<?php

declare(strict_types=1);

namespace App\Domain\Methodology;

use App\Domain\Scoring\ScoreCalculator;
use App\Models\Zone;

/**
 * Weighted-recompute simulation. Runs the calculator's pillar math
 * against a proposed weight vector and returns per-zone deltas, so an
 * admin can see the impact of a weight change before it goes live.
 */
class MethodologyPreview
{
    /**
     * @param  array<string, float>  $weights
     */
    public function __construct(private array $weights) {}

    /**
     * @return list<array{zone_id: string, zone_name: string, current: ?int, proposed: ?int, delta: ?int}>
     */
    public function compute(): array
    {
        $calc = new ScoreCalculator;

        return Zone::query()
            ->get()
            ->map(function (Zone $zone) use ($calc) {
                $pillars = $calc->pillarScores($zone);
                $current = $zone->score;
                $proposed = $calc->compositeFromPillars($pillars, $this->weights);

                return [
                    'zone_id' => $zone->id,
                    'zone_name' => $zone->name,
                    // `score` used to be NOT NULL, so this read 0 as "never
                    // scored" and threw away a zone that genuinely measured 0.
                    // The column carries a real null now, so trust it.
                    'current' => $current,
                    'proposed' => $proposed,
                    'delta' => ($current !== null && $proposed !== null)
                        ? $proposed - $current
                        : null,
                ];
            })
            ->values()
            ->all();
    }
}
