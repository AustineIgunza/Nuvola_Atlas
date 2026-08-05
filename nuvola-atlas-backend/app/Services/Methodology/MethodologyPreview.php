<?php

declare(strict_types=1);

namespace App\Services\Methodology;

use App\Models\Zone;
use App\Services\ScoreCalculator;

/**
 * Weighted-recompute simulation. Runs the calculator's pillar math
 * against a proposed weight vector and returns per-zone deltas, so an
 * admin can see the impact of a weight change before it goes live.
 */
class MethodologyPreview
{
    /**
     * @param  array{social: float, safety: float, density: float, infra: float} $weights
     */
    public function __construct(private array $weights) {}

    /**
     * @return list<array{zone_id: string, zone_name: string, current: ?int, proposed: ?int, delta: ?int}>
     */
    public function compute(): array
    {
        $calc = new ScoreCalculator();

        return Zone::query()
            ->get()
            ->map(function (Zone $zone) use ($calc) {
                $pillars = $calc->pillarScores($zone);
                $current = $zone->score;
                $proposed = $this->weighted($pillars);

                return [
                    'zone_id' => $zone->id,
                    'zone_name' => $zone->name,
                    'current' => $current === 0 ? null : $current,
                    'proposed' => $proposed,
                    'delta' => ($current !== null && $proposed !== null)
                        ? $proposed - $current
                        : null,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  array{social: ?int, safety: ?int, density: ?int, infra: ?int} $pillars
     */
    private function weighted(array $pillars): ?int
    {
        $total = 0.0;
        $wsum = 0.0;
        foreach ($this->weights as $k => $w) {
            if ($pillars[$k] === null) continue;
            $total += $pillars[$k] * $w;
            $wsum += $w;
        }
        return $wsum > 0 ? (int) round($total / $wsum) : null;
    }
}
