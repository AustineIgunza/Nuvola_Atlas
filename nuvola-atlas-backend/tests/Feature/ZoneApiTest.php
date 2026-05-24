<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Zone;
use App\Models\ZoneLayer;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ZoneApiTest extends TestCase
{
    private function seedZone(string $id = 'westlands', string $name = 'Westlands'): Zone
    {
        $zone = Zone::create([
            'id' => $id,
            'name' => $name,
            'score' => 76,
            'pillar_social' => 82,
            'pillar_safety' => 71,
            'pillar_density' => 64,
            'pillar_infra' => 80,
            'delta_social' => 3,
            'delta_safety' => -1,
            'delta_density' => 2,
            'delta_infra' => 4,
            'last_sync_min' => 4,
        ]);

        DB::statement(
            "UPDATE zones SET centroid = ST_MakePoint(36.8048, -1.2673)::geography WHERE id = ?",
            [$id]
        );

        return $zone;
    }

    public function test_can_list_zones(): void
    {
        $this->seedZone();
        $this->seedZone('starehe', 'Starehe');

        $response = $this->getJson('/api/zones');

        $response->assertOk()
            ->assertJsonCount(2)
            ->assertJsonStructure([
                '*' => ['id', 'name', 'score', 'pillars', 'deltas', 'centroid', 'lastSyncMin'],
            ]);
    }

    public function test_can_show_single_zone(): void
    {
        $this->seedZone();

        $response = $this->getJson('/api/zones/westlands');

        $response->assertOk()
            ->assertJsonPath('id', 'westlands')
            ->assertJsonPath('name', 'Westlands')
            ->assertJsonPath('score', 76);
    }

    public function test_show_zone_includes_layers(): void
    {
        $zone = $this->seedZone();

        ZoneLayer::create([
            'zone_id' => $zone->id,
            'layer_type' => 'road_progress',
            'geojson' => ['type' => 'FeatureCollection', 'features' => []],
        ]);

        $response = $this->getJson('/api/zones/westlands');

        $response->assertOk()
            ->assertJsonStructure(['layers' => ['roadProgress', 'smartGrid', 'density']]);
    }

    public function test_show_zone_not_found_returns_404(): void
    {
        $response = $this->getJson('/api/zones/nonexistent');

        $response->assertNotFound();
    }

    public function test_can_get_zone_activity(): void
    {
        $zone = $this->seedZone();

        Activity::create([
            'id' => 'act1',
            'zone_id' => $zone->id,
            'kind' => 'road',
            'text' => 'Road work completed',
            'source' => 'KeNHA',
        ]);

        $response = $this->getJson('/api/zones/westlands/activity');

        $response->assertOk()->assertJsonCount(1);
    }

    public function test_can_get_zone_layers(): void
    {
        $zone = $this->seedZone();

        ZoneLayer::create([
            'zone_id' => $zone->id,
            'layer_type' => 'density',
            'geojson' => ['type' => 'FeatureCollection', 'features' => []],
        ]);

        $response = $this->getJson('/api/zones/westlands/layers');

        $response->assertOk()->assertJsonCount(1);
    }
}
