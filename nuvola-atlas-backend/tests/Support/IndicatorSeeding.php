<?php

declare(strict_types=1);

namespace Tests\Support;

/**
 * Shared indicator seeding helpers for the phpunit suite. The July 2026
 * schema swap replaced 4 pillar columns with 13 indicator columns; every
 * test that used to seed pillars now needs a matching bundle of indicators
 * so the derived pillar averages come out where the tests expect them.
 *
 * Set every indicator in a pillar to the pillar's target value — since the
 * pillar score is a simple average, that guarantees the pillar reads back
 * the exact value we asked for.
 */
final class IndicatorSeeding
{
    /**
     * Map a pillar-shaped array to indicator columns.
     *
     * @param  array{social?: int, safety?: int, density?: int, infra?: int}  $pillars
     * @return array<string, int>
     */
    public static function fromPillars(array $pillars): array
    {
        $out = [];
        foreach (self::indicatorsByPillar() as $pillar => $indicators) {
            if (! array_key_exists($pillar, $pillars)) {
                continue;
            }
            $value = (int) $pillars[$pillar];
            foreach ($indicators as $slug) {
                $out['indicator_'.$slug] = $value;
            }
        }

        return $out;
    }

    /** @return list<string> the 13 indicator column names in canonical order */
    public static function allColumns(): array
    {
        $cols = [];
        foreach (self::indicatorsByPillar() as $indicators) {
            foreach ($indicators as $slug) {
                $cols[] = 'indicator_'.$slug;
            }
        }

        return $cols;
    }

    /** @return array<string, list<string>> */
    private static function indicatorsByPillar(): array
    {
        return [
            'social' => ['healthcare_access', 'education_access', 'digital_connectivity'],
            'safety' => ['crime_rates', 'emergency_response_access', 'disaster_exposure'],
            'density' => ['population_density', 'congestion', 'housing_pressure'],
            'infra' => ['road_quality', 'energy_reliability', 'food_risk', 'waste_management'],
        ];
    }
}
