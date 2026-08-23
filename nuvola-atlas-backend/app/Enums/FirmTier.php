<?php

declare(strict_types=1);

namespace App\Enums;

use App\Support\Pillars;

/**
 * Investor firm tier. Drives the /investor/opportunities heuristic — each
 * tier weights the pillars differently when ranking non-watchlisted zones.
 *
 * Enum stored as a plain string in the `firms.tier` column, backed by a
 * CHECK constraint at the DB level (see the create_firms_table migration).
 */
enum FirmTier: string
{
    case Basic = 'basic';
    case Deal = 'deal';
    case Sovereign = 'sovereign';

    /**
     * How much each tier cares about each pillar, before the registry gets a
     * say. This is investor policy, not a pillar definition, which is why it
     * lives here rather than in pillars.json.
     *
     * A pillar absent from a tier's map falls back to its registry weight, so
     * adding a pillar does not silently drop it out of the ranking.
     *
     * @return array<string, float>
     */
    private function emphasis(): array
    {
        return match ($this) {
            // Capital-preserving: is the basic service floor already there?
            self::Basic => ['water_sanitation' => 0.55, 'road_density' => 0.20, 'transit_access' => 0.25],
            // Growth-first: can goods and labour actually move?
            self::Deal => ['water_sanitation' => 0.20, 'road_density' => 0.40, 'transit_access' => 0.40],
            // Resilience and impact: where does service delivery fall shortest?
            self::Sovereign => ['water_sanitation' => 0.50, 'road_density' => 0.20, 'transit_access' => 0.30],
        };
    }

    /**
     * Per-pillar weight vector used by the opportunity ranker, normalized to
     * sum to 1 across the pillars that can carry weight.
     *
     * A held pillar is pinned to 0 here for the same reason it is pinned to 0
     * in the composite: a 2019 reading is context with a date attached, not an
     * input to a ranking a firm might act on in 2026.
     *
     * @return array<string, float>
     */
    public function opportunityWeights(): array
    {
        $emphasis = $this->emphasis();
        $registry = Pillars::weights();

        $weights = [];
        foreach (Pillars::keys() as $key) {
            $weights[$key] = $registry[$key] <= 0.0
                ? 0.0
                : (float) ($emphasis[$key] ?? $registry[$key]);
        }

        $total = array_sum($weights);

        return $total > 0.0
            ? array_map(fn (float $w) => $w / $total, $weights)
            : $registry;
    }
}
