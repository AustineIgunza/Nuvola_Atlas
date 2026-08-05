<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Investor firm tier. Drives the /investor/opportunities heuristic —
 * each tier weights the four pillars differently when ranking non-
 * watchlisted zones.
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
     * Per-pillar weight vector used by the opportunity ranker.
     *
     * @return array{social: float, safety: float, density: float, infra: float}
     */
    public function opportunityWeights(): array
    {
        return match ($this) {
            // Basic-tier: capital-preserving, favours safety + infra.
            self::Basic => ['social' => 0.15, 'safety' => 0.35, 'density' => 0.20, 'infra' => 0.30],
            // Deal-tier: growth-first, favours density + social (talent).
            self::Deal => ['social' => 0.30, 'safety' => 0.15, 'density' => 0.35, 'infra' => 0.20],
            // Sovereign-tier: resilience/impact, favours social + infra.
            self::Sovereign => ['social' => 0.35, 'safety' => 0.20, 'density' => 0.10, 'infra' => 0.35],
        };
    }
}
