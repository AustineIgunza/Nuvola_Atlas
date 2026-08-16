<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\Zone;
use App\Services\ScoreCalculator;
use Tests\TestCase;

/**
 * The scoring model after the July 2026 rewrite:
 * - 13 indicators, each 0-100 or NULL.
 * - Pillar = simple average of its non-null indicators.
 * - Composite = simple average of pillars that aren't fully null.
 * - Missing indicators are NEVER counted as zero.
 */
class ScoreCalculationTest extends TestCase
{
    public function test_pillar_scores_average_indicators(): void
    {
        $calc = new ScoreCalculator;

        $zone = new Zone([
            // social: (80 + 70 + 60) / 3 = 70
            'indicator_healthcare_access' => 80,
            'indicator_education_access' => 70,
            'indicator_digital_connectivity' => 60,
            // safety: (66 + 72 + 60) / 3 = 66
            'indicator_crime_rates' => 66,
            'indicator_emergency_response_access' => 72,
            'indicator_disaster_exposure' => 60,
            // density: (50 + 60 + 70) / 3 = 60
            'indicator_population_density' => 50,
            'indicator_congestion' => 60,
            'indicator_housing_pressure' => 70,
            // infra: (75 + 65 + 60 + 80) / 4 = 70
            'indicator_road_quality' => 75,
            'indicator_energy_reliability' => 65,
            'indicator_food_risk' => 60,
            'indicator_waste_management' => 80,
        ]);

        $pillars = $calc->pillarScores($zone);

        $this->assertSame(70, $pillars['social']);
        $this->assertSame(66, $pillars['safety']);
        $this->assertSame(60, $pillars['density']);
        $this->assertSame(70, $pillars['infra']);
    }

    public function test_composite_score_is_average_of_pillars(): void
    {
        $calc = new ScoreCalculator;

        $zone = new Zone([
            'indicator_healthcare_access' => 80,
            'indicator_education_access' => 70,
            'indicator_digital_connectivity' => 60,
            'indicator_crime_rates' => 66,
            'indicator_emergency_response_access' => 72,
            'indicator_disaster_exposure' => 60,
            'indicator_population_density' => 50,
            'indicator_congestion' => 60,
            'indicator_housing_pressure' => 70,
            'indicator_road_quality' => 75,
            'indicator_energy_reliability' => 65,
            'indicator_food_risk' => 60,
            'indicator_waste_management' => 80,
        ]);

        // (70 + 66 + 60 + 70) / 4 = 66.5 → 67
        $this->assertSame(67, $calc->calculateScore($zone));
    }

    public function test_null_indicators_are_excluded_not_treated_as_zero(): void
    {
        $calc = new ScoreCalculator;

        // Only two of the three social indicators exist. The average must
        // be over those two, not diluted with a fake zero for the missing
        // one — this is the whole reason for the July 2026 rewrite.
        $zone = new Zone([
            'indicator_healthcare_access' => 80,
            'indicator_education_access' => 70,
            'indicator_digital_connectivity' => null,
        ]);

        $pillars = $calc->pillarScores($zone);

        $this->assertSame(75, $pillars['social']); // (80 + 70) / 2 = 75
        $this->assertNull($pillars['safety']);
        $this->assertNull($pillars['density']);
        $this->assertNull($pillars['infra']);
    }

    public function test_pillar_with_all_indicators_null_returns_null(): void
    {
        $calc = new ScoreCalculator;

        // A zone with no indicator readings at all — every pillar is null,
        // the composite is null, and the API surfaces this as "Awaiting data".
        $zone = new Zone;

        $this->assertNull($calc->calculateScore($zone));
        $pillars = $calc->pillarScores($zone);
        foreach ($pillars as $value) {
            $this->assertNull($value);
        }
    }

    public function test_missing_indicators_lists_the_gaps(): void
    {
        $calc = new ScoreCalculator;

        $zone = new Zone([
            'indicator_healthcare_access' => 80,
            'indicator_crime_rates' => 65,
        ]);

        $missing = $calc->missingIndicators($zone);

        // 13 total indicators, 2 seeded → 11 missing.
        $this->assertCount(11, $missing);
        $this->assertNotContains('healthcare_access', $missing);
        $this->assertNotContains('crime_rates', $missing);
        $this->assertContains('digital_connectivity', $missing);
        $this->assertContains('waste_management', $missing);
    }

    public function test_pillar_scores_from_values_matches_pillar_scores(): void
    {
        $calc = new ScoreCalculator;

        $values = [
            'healthcare_access' => 80,
            'education_access' => 70,
            'digital_connectivity' => 60,
            'crime_rates' => 66,
            'emergency_response_access' => 72,
            'disaster_exposure' => 60,
            'population_density' => 50,
            'congestion' => 60,
            'housing_pressure' => 70,
            'road_quality' => 75,
            'energy_reliability' => 65,
            'food_risk' => 60,
            'waste_management' => 80,
        ];

        $fromValues = $calc->pillarScoresFromValues($values);

        // Build the equivalent Zone for a sanity cross-check.
        $zone = new Zone(array_combine(
            array_map(fn ($k) => 'indicator_'.$k, array_keys($values)),
            array_values($values),
        ));

        $this->assertSame($calc->pillarScores($zone), $fromValues);
    }
}
