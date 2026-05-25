<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\Zone;
use App\Services\ScoreCalculator;
use Tests\TestCase;

class ScoreCalculationTest extends TestCase
{
    public function test_weights_are_derived_from_methodology_config(): void
    {
        $calculator = new ScoreCalculator();
        $weights = $calculator->getWeights();

        // social=3, safety=3, density=2, infra=5 sub-metrics → total=13
        $this->assertEqualsWithDelta(3 / 13, $weights['social'], 0.001);
        $this->assertEqualsWithDelta(3 / 13, $weights['safety'], 0.001);
        $this->assertEqualsWithDelta(2 / 13, $weights['density'], 0.001);
        $this->assertEqualsWithDelta(5 / 13, $weights['infra'], 0.001);
    }

    public function test_weighted_score_calculation(): void
    {
        $calculator = new ScoreCalculator();

        $zone = new Zone([
            'pillar_social' => 82,
            'pillar_safety' => 71,
            'pillar_density' => 64,
            'pillar_infra' => 80,
        ]);

        $score = $calculator->calculateScore($zone);

        // (82*3 + 71*3 + 64*2 + 80*5) / 13 = (246+213+128+400)/13 = 987/13 ≈ 75.9 → 76
        $this->assertSame(76, $score);
    }

    public function test_weights_sum_to_one(): void
    {
        $calculator = new ScoreCalculator();
        $weights = $calculator->getWeights();

        $this->assertEqualsWithDelta(1.0, array_sum($weights), 0.01);
    }
}
