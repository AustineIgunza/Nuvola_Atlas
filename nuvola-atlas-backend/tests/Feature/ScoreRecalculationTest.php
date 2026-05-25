<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Zone;
use App\Models\ZoneLayer;
use App\Services\ScoreCalculator;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ScoreRecalculationTest extends TestCase
{
    private function createTestZone(string $id = 'test-zone'): Zone
    {
        DB::statement(
            "INSERT INTO zones (id, name, score, pillar_social, pillar_safety, pillar_density, pillar_infra,
             delta_social, delta_safety, delta_density, delta_infra, last_sync_min,
             centroid, created_at, updated_at)
             VALUES (?, ?, 0, 80, 70, 60, 75, 0, 0, 0, 0, 99,
             ST_GeogFromText('POINT(36.82 -1.29)'), now(), now())",
            [$id, 'Test Zone']
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

    public function test_artisan_command_uses_weighted_scoring(): void
    {
        $this->createTestZone();

        $this->artisan('atlas:recalculate-scores', ['--zone' => 'test-zone'])
            ->assertSuccessful();

        $zone = Zone::find('test-zone');
        // Weighted: (80*3 + 70*3 + 60*2 + 75*5) / 13 = (240+210+120+375)/13 ≈ 72.7 → 73
        $this->assertSame(73, $zone->score);
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

    public function test_methodology_endpoint_includes_weights(): void
    {
        $response = $this->getJson('/api/vitality/methodology');

        $response->assertOk()
            ->assertJsonStructure(['pillars', 'weights'])
            ->assertJsonPath('weights.social', fn ($v) => $v > 0)
            ->assertJsonPath('weights.infra', fn ($v) => $v > 0);
    }
}
