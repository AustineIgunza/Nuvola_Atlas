<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Zone;
use App\Models\ZoneLayer;
use Illuminate\Support\Facades\DB;
use Tests\Support\IndicatorSeeding;
use Tests\TestCase;

class ZoneApiTest extends TestCase
{
    private function seedZone(string $id = 'westlands', string $name = 'Westlands'): Zone
    {
        // Pillar scores of 82/71/64/80 map to setting every indicator in a
        // pillar to that value. Deltas dropped in the migration.
        $zone = Zone::create(array_merge([
            'id' => $id,
            'name' => $name,
            'score' => 76,
            'last_sync_min' => 4,
        ], IndicatorSeeding::fromPillars([
            'social' => 82,
            'safety' => 71,
            'density' => 64,
            'infra' => 80,
        ])));

        DB::statement(
            'UPDATE zones SET centroid = ST_MakePoint(36.8048, -1.2673)::geography WHERE id = ?',
            [$id]
        );

        return $zone;
    }

    public function test_can_list_zones(): void
    {
        $this->seedZone();
        $this->seedZone('starehe', 'Starehe');

        $response = $this->getJson('/api/v1/zones');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure([
                'data' => ['*' => ['id', 'name', 'score', 'pillars', 'deltas', 'centroid', 'lastSyncMin']],
            ]);
    }

    public function test_can_show_single_zone(): void
    {
        $this->seedZone();

        $response = $this->getJson('/api/v1/zones/westlands');

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

        $response = $this->getJson('/api/v1/zones/westlands');

        $response->assertOk()
            ->assertJsonStructure(['layers' => ['roadProgress', 'smartGrid', 'density']]);
    }

    public function test_show_zone_not_found_returns_404(): void
    {
        $response = $this->getJson('/api/v1/zones/nonexistent');

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

        $response = $this->getJson('/api/v1/zones/westlands/activity');

        $response->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_can_get_zone_layers(): void
    {
        $zone = $this->seedZone();

        ZoneLayer::create([
            'zone_id' => $zone->id,
            'layer_type' => 'density',
            'geojson' => ['type' => 'FeatureCollection', 'features' => []],
        ]);

        $response = $this->getJson('/api/v1/zones/westlands/layers');

        $response->assertOk()->assertJsonCount(1);
    }
}
