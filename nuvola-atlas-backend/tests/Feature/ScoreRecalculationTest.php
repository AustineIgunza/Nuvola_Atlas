<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Zone;
use App\Models\ZoneLayer;
use App\Services\ScoreCalculator;
use Illuminate\Support\Facades\DB;
use Tests\Support\IndicatorSeeding;
use Tests\TestCase;

class ScoreRecalculationTest extends TestCase
{
    private function createTestZone(string $id = 'test-zone'): Zone
    {
        // Same pillar averages the pre-migration test used (80/70/60/75)
        // — set every indicator in a pillar to that pillar's target so the
        // averages come out identical, and the numeric assertions below stay
        // meaningful across the schema swap.
        $indicators = IndicatorSeeding::fromPillars([
            'social' => 80,
            'safety' => 70,
            'density' => 60,
            'infra' => 75,
        ]);

        $indicatorCols = implode(', ', array_keys($indicators));
        $indicatorPlaceholders = implode(', ', array_fill(0, count($indicators), '?'));

        DB::statement(
            "INSERT INTO zones (id, name, score, {$indicatorCols}, last_sync_min,
             centroid, created_at, updated_at)
             VALUES (?, ?, 0, {$indicatorPlaceholders}, 99,
             ST_GeogFromText('POINT(36.82 -1.29)'), now(), now())",
            array_merge([$id, 'Test Zone'], array_values($indicators))
        );

        return Zone::find($id);
    }

    public function test_score_calculator_recalculates_zone(): void
    {
        $zone = $this->createTestZone();
        $calculator = new ScoreCalculator();

        $calculator->recalculate($zone);

        $zone->refresh();
        $this->assertGreaterThan(0, $zone->score);
        $this->assertSame(0, $zone->last_sync_min);
    }

    public function test_artisan_command_recomputes_indicator_average(): void
    {
        $this->createTestZone();

        $this->artisan('atlas:recalculate-scores', ['--zone' => 'test-zone'])
            ->assertSuccessful();

        $zone = Zone::find('test-zone');
        // Simple average of the 4 pillars: (80 + 70 + 60 + 75) / 4 = 71.25 → 71
        $this->assertSame(71, $zone->score);
    }

    public function test_zone_layer_observer_dispatches_recalculation(): void
    {
        $zone = $this->createTestZone('observer-zone');

        // Creating a layer triggers the observer, which dispatches RecalculateZoneScore
        // In test mode, queue is sync so it runs immediately
        ZoneLayer::create([
            'zone_id' => 'observer-zone',
            'layer_type' => 'road_progress',
            'geojson' => ['type' => 'FeatureCollection', 'features' => []],
        ]);

        $zone->refresh();
        $this->assertGreaterThan(0, $zone->score);
    }

    public function test_methodology_endpoint_exposes_weights(): void
    {
        $response = $this->getJson('/api/v1/vitality/methodology');

        // Post-July-2026 the composite is a simple average of the four pillars,
        // so weights are all 0.25 — the endpoint still exposes them so the
        // client's compat contract holds.
        $response->assertOk()
            ->assertJsonStructure(['pillars', 'weights'])
            ->assertJsonPath('weights.social', 0.25)
            ->assertJsonPath('weights.infra', 0.25);
    }
}
