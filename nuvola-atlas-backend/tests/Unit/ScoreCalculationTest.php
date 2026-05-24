<?php

declare(strict_types=1);

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ScoreCalculationTest extends TestCase
{
    public function test_score_is_average_of_four_pillars(): void
    {
        $social = 82;
        $safety = 71;
        $density = 64;
        $infra = 80;

        $score = (int) round(($social + $safety + $density + $infra) / 4);

        $this->assertSame(74, $score);
    }
}
