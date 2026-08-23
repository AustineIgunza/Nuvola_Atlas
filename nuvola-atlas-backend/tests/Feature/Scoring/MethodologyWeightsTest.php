<?php

declare(strict_types=1);

namespace Tests\Feature\Scoring;

use App\Models\MethodologyVersion;
use App\Models\Zone;
use App\Services\Methodology\MethodologyPublisher;
use App\Services\ScoreCalculator;
use App\Support\Pillars;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Phase E — the composite score is a weighted mean over the published
 * methodology, not a hardcoded vector. Weights are renormalized across the
 * pillars a zone actually has, so a missing pillar is dropped from both sides
 * of the ratio rather than counted as zero.
 */
class MethodologyWeightsTest extends TestCase
{
    /** @param array<string, ?int> $values */
    private function zoneWithPillars(array $values): Zone
    {
        $columns = [];
        foreach ($values as $key => $value) {
            $columns[Pillars::column($key)] = $value;
        }

        return (new Zone)->forceFill($columns);
    }

    private function publishWeights(array $weights, string $version = 'v2.0.0'): MethodologyVersion
    {
        $row = MethodologyVersion::create([
            'version' => $version,
            'weights' => $weights,
            'bands' => [],
            'is_current' => true,
            'draft' => false,
        ]);

        // Writing the row directly skips MethodologyPublisher, which is what
        // normally busts this cache. Without the forget, a test that read a
        // score before publishing would keep scoring on the old weights.
        Cache::forget(ScoreCalculator::WEIGHTS_CACHE_KEY);

        return $row;
    }

    public function test_weights_default_to_the_registry_before_anything_is_published(): void
    {
        $this->assertSame(Pillars::weights(), (new ScoreCalculator)->getWeights());
    }

    public function test_published_weights_replace_the_defaults(): void
    {
        $published = [
            'water_sanitation' => 0.4,
            'road_density' => 0.3,
            'transit_access' => 0.2,
            'electricity_access' => 0.1,
        ];

        $this->publishWeights($published);

        $this->assertSame($published, (new ScoreCalculator)->getWeights());
    }

    public function test_equal_weights_reproduce_the_simple_average(): void
    {
        $this->publishWeights(array_fill_keys(Pillars::keys(), 0.25));

        // (70 + 66 + 60 + 70) / 4 = 66.5 → 67.
        $this->assertSame(67, (new ScoreCalculator)->calculateScore($this->zoneWithPillars([
            'water_sanitation' => 70,
            'road_density' => 66,
            'transit_access' => 60,
            'electricity_access' => 70,
        ])));
    }

    public function test_uneven_weights_shift_the_composite(): void
    {
        $this->publishWeights([
            'water_sanitation' => 0.7,
            'road_density' => 0.1,
            'transit_access' => 0.1,
            'electricity_access' => 0.1,
        ]);

        // 0.7·90 + 0.1·30 + 0.1·30 + 0.1·30 = 72
        $this->assertSame(72, (new ScoreCalculator)->calculateScore($this->zoneWithPillars([
            'water_sanitation' => 90,
            'road_density' => 30,
            'transit_access' => 30,
            'electricity_access' => 30,
        ])));
    }

    public function test_weights_are_renormalized_over_the_pillars_a_zone_actually_has(): void
    {
        $this->publishWeights([
            'water_sanitation' => 0.5,
            'road_density' => 0.3,
            'transit_access' => 0.1,
            'electricity_access' => 0.1,
        ]);

        // Only water and road have readings. The composite is
        // (0.5·80 + 0.3·40) / 0.8 = 65 — the missing pillars are dropped
        // from both sides of the ratio, never counted as zero.
        $this->assertSame(65, (new ScoreCalculator)->calculateScore($this->zoneWithPillars([
            'water_sanitation' => 80,
            'road_density' => 40,
        ])));
    }

    public function test_a_malformed_weight_falls_back_to_that_pillars_default(): void
    {
        $this->publishWeights([
            'water_sanitation' => 'heavy',
            'road_density' => -1,
            'transit_access' => 0.25,
        ]);

        $expected = Pillars::weights();
        $expected['transit_access'] = 0.25;

        $this->assertSame($expected, (new ScoreCalculator)->getWeights());
    }

    public function test_a_weight_for_a_retired_pillar_is_ignored(): void
    {
        // A stale methodology row from before the refocus must not be able to
        // reintroduce a switched-off pillar into the scoring vector.
        $this->publishWeights([
            'water_sanitation' => 0.5,
            'road_density' => 0.25,
            'transit_access' => 0.25,
            'safety' => 0.9,
            'freedom_index' => 0.9,
        ]);

        $weights = (new ScoreCalculator)->getWeights();

        $this->assertSame(Pillars::keys(), array_keys($weights));
        $this->assertSame([], array_intersect(array_keys($weights), Pillars::retiredKeys()));
    }

    public function test_publishing_invalidates_the_cached_weights(): void
    {
        Queue::fake();

        // Warm the 60s cache against the registry default.
        $this->assertSame(Pillars::weights(), (new ScoreCalculator)->getWeights());
        $this->assertTrue(Cache::has(ScoreCalculator::WEIGHTS_CACHE_KEY));

        $updated = [
            'water_sanitation' => 0.55,
            'road_density' => 0.15,
            'transit_access' => 0.15,
            'electricity_access' => 0.15,
        ];

        $target = MethodologyVersion::create([
            'version' => 'v3.0.0',
            'weights' => $updated,
            'bands' => [],
            'is_current' => false,
            'draft' => false,
        ]);

        app(MethodologyPublisher::class)->publish($target);

        $this->assertSame($updated, (new ScoreCalculator)->getWeights());
    }

    public function test_preview_projects_the_score_publishing_would_produce(): void
    {
        Queue::fake();

        Zone::factory()->create([
            'id' => 'embakasi',
            'pillar_water_sanitation' => 90,
            'pillar_road_density' => 30,
            'pillar_transit_access' => 30,
            'pillar_electricity_access' => 30,
        ]);

        $weights = [
            'water_sanitation' => 0.7,
            'road_density' => 0.1,
            'transit_access' => 0.1,
            'electricity_access' => 0.1,
        ];
        $publisher = app(MethodologyPublisher::class);

        $projected = $publisher->previewImpact($weights)->compute()[0]['proposed'];

        $this->publishWeights($weights, 'v4.0.0');
        $recomputed = (new ScoreCalculator)->calculateScore(Zone::find('embakasi'));

        $this->assertSame($projected, $recomputed);
    }
}
