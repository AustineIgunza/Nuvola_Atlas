<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Domain\Scoring\ScoreCalculator;
use App\Models\Zone;
use App\Support\Pillars;
use Tests\TestCase;

/**
 * The scoring model after the August 2026 refocus:
 * - One measured value per live pillar, 0-100 or NULL.
 * - Composite = weighted mean of the pillars that have a value, renormalized
 *   over exactly those pillars.
 * - A missing pillar is NEVER treated as zero.
 * - A held pillar carries weight 0: it reports, but it does not move the score.
 */
class ScoreCalculationTest extends TestCase
{
    /** @param array<string, ?int> $values */
    private function zone(array $values): Zone
    {
        $columns = [];
        foreach ($values as $key => $value) {
            $columns[Pillars::column($key)] = $value;
        }

        return (new Zone)->forceFill($columns);
    }

    public function test_pillar_scores_read_one_value_per_live_pillar(): void
    {
        $calc = new ScoreCalculator;

        $pillars = $calc->pillarScores($this->zone([
            'water_sanitation' => 70,
            'road_density' => 66,
            'transit_access' => 60,
            'electricity_access' => 90,
        ]));

        $this->assertSame(Pillars::keys(), array_keys($pillars));
        $this->assertSame(70, $pillars['water_sanitation']);
        $this->assertSame(66, $pillars['road_density']);
        $this->assertSame(60, $pillars['transit_access']);
        $this->assertSame(90, $pillars['electricity_access']);
    }

    public function test_composite_is_the_weighted_mean_and_held_pillars_carry_no_weight(): void
    {
        $calc = new ScoreCalculator;

        // (0.4·70 + 0.3·66 + 0.3·60) / 1.0 = 65.8 → 66. Electricity is held at
        // weight 0, so a 90 there must not drag the composite upward.
        $this->assertSame(66, $calc->calculateScore($this->zone([
            'water_sanitation' => 70,
            'road_density' => 66,
            'transit_access' => 60,
            'electricity_access' => 90,
        ])));
    }

    public function test_null_pillars_are_excluded_not_treated_as_zero(): void
    {
        $calc = new ScoreCalculator;

        // Weights renormalize over the two pillars that exist:
        // (0.4·80 + 0.3·70) / 0.7 = 75.71 → 76. Averaging a fabricated zero in
        // for transit would give 50 — the collapse the July rewrite removed.
        $zone = $this->zone([
            'water_sanitation' => 80,
            'road_density' => 70,
            'transit_access' => null,
            'electricity_access' => null,
        ]);

        $this->assertSame(76, $calc->calculateScore($zone));
        $this->assertNull($calc->pillarScores($zone)['transit_access']);
    }

    public function test_a_zone_with_no_readings_scores_null(): void
    {
        $calc = new ScoreCalculator;

        $zone = new Zone;

        $this->assertNull($calc->calculateScore($zone));
        foreach ($calc->pillarScores($zone) as $value) {
            $this->assertNull($value);
        }
    }

    public function test_a_zone_with_only_a_held_pillar_scores_null(): void
    {
        $calc = new ScoreCalculator;

        // Nothing with weight has a reading, so there is no defensible
        // composite. Reporting the held value as the score would present a
        // 2019 census figure as a 2026 service-performance score.
        $this->assertNull($calc->calculateScore($this->zone([
            'electricity_access' => 90,
        ])));
    }

    public function test_missing_pillars_lists_the_gaps(): void
    {
        $calc = new ScoreCalculator;

        $missing = $calc->missingPillars($this->zone([
            'water_sanitation' => 80,
            'road_density' => 65,
        ]));

        $this->assertSame(['transit_access', 'electricity_access'], $missing);
    }

    public function test_retired_pillars_never_appear_in_the_scores(): void
    {
        $calc = new ScoreCalculator;

        $pillars = $calc->pillarScores($this->zone(['water_sanitation' => 80]));

        $this->assertSame([], array_intersect(array_keys($pillars), Pillars::retiredKeys()));
    }

    public function test_pillar_scores_from_values_matches_pillar_scores(): void
    {
        $calc = new ScoreCalculator;

        $values = [
            'water_sanitation' => 80,
            'road_density' => 70,
            'transit_access' => 60,
            'electricity_access' => 90,
        ];

        $this->assertSame(
            $calc->pillarScores($this->zone($values)),
            $calc->pillarScoresFromValues($values),
        );
    }
}
