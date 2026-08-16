<?php

declare(strict_types=1);

namespace Tests\Feature\Scoring;

use App\Models\MethodologyVersion;
use App\Models\Zone;
use App\Services\Methodology\MethodologyPublisher;
use App\Services\ScoreCalculator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Phase E — the composite score is a weighted mean over the published
 * methodology, not a hardcoded quartet. Weights are renormalized across
 * the pillars a zone actually has, so equal weights still reduce to the
 * simple average the July 2026 rewrite established.
 */
class MethodologyWeightsTest extends TestCase
{
    private function zoneWithPillars(int $social, int $safety, int $density, int $infra): Zone
    {
        return new Zone([
            'indicator_healthcare_access' => $social,
            'indicator_education_access' => $social,
            'indicator_digital_connectivity' => $social,
            'indicator_crime_rates' => $safety,
            'indicator_emergency_response_access' => $safety,
            'indicator_disaster_exposure' => $safety,
            'indicator_population_density' => $density,
            'indicator_congestion' => $density,
            'indicator_housing_pressure' => $density,
            'indicator_road_quality' => $infra,
            'indicator_energy_reliability' => $infra,
            'indicator_food_risk' => $infra,
            'indicator_waste_management' => $infra,
        ]);
    }

    private function publishWeights(array $weights, string $version = 'v2.0.0'): MethodologyVersion
    {
        return MethodologyVersion::create([
            'version' => $version,
            'weights' => $weights,
            'bands' => [],
            'is_current' => true,
            'draft' => false,
        ]);
    }

    public function test_weights_default_to_the_equal_quartet_before_anything_is_published(): void
    {
        $this->assertSame(ScoreCalculator::DEFAULT_WEIGHTS, (new ScoreCalculator)->getWeights());
    }

    public function test_published_weights_replace_the_defaults(): void
    {
        $this->publishWeights(['social' => 0.4, 'safety' => 0.3, 'density' => 0.2, 'infra' => 0.1]);

        $this->assertSame(
            ['social' => 0.4, 'safety' => 0.3, 'density' => 0.2, 'infra' => 0.1],
            (new ScoreCalculator)->getWeights(),
        );
    }

    public function test_equal_weights_reproduce_the_simple_average(): void
    {
        $this->publishWeights(ScoreCalculator::DEFAULT_WEIGHTS);

        // (70 + 66 + 60 + 70) / 4 = 66.5 → 67, same as before Phase E.
        $this->assertSame(
            67,
            (new ScoreCalculator)->calculateScore($this->zoneWithPillars(70, 66, 60, 70)),
        );
    }

    public function test_uneven_weights_shift_the_composite(): void
    {
        $this->publishWeights(['social' => 0.7, 'safety' => 0.1, 'density' => 0.1, 'infra' => 0.1]);

        // 0.7·90 + 0.1·30 + 0.1·30 + 0.1·30 = 72
        $this->assertSame(
            72,
            (new ScoreCalculator)->calculateScore($this->zoneWithPillars(90, 30, 30, 30)),
        );
    }

    public function test_weights_are_renormalized_over_the_pillars_a_zone_actually_has(): void
    {
        $this->publishWeights(['social' => 0.5, 'safety' => 0.3, 'density' => 0.1, 'infra' => 0.1]);

        // Only social and safety have readings. The composite is
        // (0.5·80 + 0.3·40) / 0.8 = 65 — the missing pillars are dropped
        // from both sides of the ratio, never counted as zero.
        $zone = new Zone([
            'indicator_healthcare_access' => 80,
            'indicator_education_access' => 80,
            'indicator_digital_connectivity' => 80,
            'indicator_crime_rates' => 40,
            'indicator_emergency_response_access' => 40,
            'indicator_disaster_exposure' => 40,
        ]);

        $this->assertSame(65, (new ScoreCalculator)->calculateScore($zone));
    }

    public function test_a_malformed_weight_falls_back_to_that_pillars_default(): void
    {
        $this->publishWeights(['social' => 'heavy', 'safety' => -1, 'infra' => 0.25]);

        $this->assertSame(ScoreCalculator::DEFAULT_WEIGHTS, (new ScoreCalculator)->getWeights());
    }

    public function test_publishing_invalidates_the_cached_weights(): void
    {
        Queue::fake();

        // Warm the 60s cache against the equal-weight default.
        $this->assertSame(ScoreCalculator::DEFAULT_WEIGHTS, (new ScoreCalculator)->getWeights());
        $this->assertTrue(Cache::has(ScoreCalculator::WEIGHTS_CACHE_KEY));

        $target = MethodologyVersion::create([
            'version' => 'v3.0.0',
            'weights' => ['social' => 0.55, 'safety' => 0.15, 'density' => 0.15, 'infra' => 0.15],
            'bands' => [],
            'is_current' => false,
            'draft' => false,
        ]);

        app(MethodologyPublisher::class)->publish($target);

        $this->assertSame(
            ['social' => 0.55, 'safety' => 0.15, 'density' => 0.15, 'infra' => 0.15],
            (new ScoreCalculator)->getWeights(),
        );
    }

    public function test_preview_projects_the_score_publishing_would_produce(): void
    {
        Queue::fake();

        Zone::factory()->create([
            'id' => 'embakasi',
            'indicator_healthcare_access' => 90,
            'indicator_education_access' => 90,
            'indicator_digital_connectivity' => 90,
            'indicator_crime_rates' => 30,
            'indicator_emergency_response_access' => 30,
            'indicator_disaster_exposure' => 30,
            'indicator_population_density' => 30,
            'indicator_congestion' => 30,
            'indicator_housing_pressure' => 30,
            'indicator_road_quality' => 30,
            'indicator_energy_reliability' => 30,
            'indicator_food_risk' => 30,
            'indicator_waste_management' => 30,
        ]);

        $weights = ['social' => 0.7, 'safety' => 0.1, 'density' => 0.1, 'infra' => 0.1];
        $publisher = app(MethodologyPublisher::class);

        $projected = $publisher->previewImpact($weights)->compute()[0]['proposed'];

        $this->publishWeights($weights, 'v4.0.0');
        $recomputed = (new ScoreCalculator)->calculateScore(Zone::find('embakasi'));

        $this->assertSame($projected, $recomputed);
    }
}
