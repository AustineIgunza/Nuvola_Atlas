<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Zone;
use App\Models\ZoneScoreSnapshot;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Tests\Support\PillarSeeding;
use Tests\TestCase;

class ZoneForecastApiTest extends TestCase
{
    private function seedZone(): Zone
    {
        $zone = Zone::create(array_merge([
            'id' => 'westlands',
            'name' => 'Westlands',
            'score' => 76,
            'last_sync_min' => 4,
        ], PillarSeeding::columns([
            'water_sanitation' => 82,
            'road_density' => 71,
            'transit_access' => 64,
            'electricity_access' => 80,
        ])));
        DB::statement(
            'UPDATE zones SET centroid = ST_MakePoint(36.8048, -1.2673)::geography WHERE id = ?',
            ['westlands']
        );

        return $zone;
    }

    private function seedHistory(string $zoneId, int $days = 30): void
    {
        $now = CarbonImmutable::now();
        $pillars = PillarSeeding::columns([
            'water_sanitation' => 80,
            'road_density' => 71,
            'transit_access' => 65,
            'electricity_access' => 78,
        ]);
        for ($i = 0; $i < $days; $i++) {
            ZoneScoreSnapshot::create(array_merge([
                'zone_id' => $zoneId,
                'captured_at' => $now->subDays($i)->setTime(12, 0),
                'score' => 70 + ($i % 6),
            ], $pillars));
        }
    }

    public function test_default_horizon_returns_14_points(): void
    {
        $this->seedZone();
        $this->seedHistory('westlands');

        $r = $this->getJson('/api/v1/zones/westlands/forecast');
        $r->assertOk()
            ->assertJsonPath('horizon', 14)
            ->assertJsonStructure(['horizon', 'points' => ['*' => ['t', 'score', 'lower', 'upper']]]);
        $this->assertCount(14, $r->json('points'));
    }

    public function test_custom_horizon_within_bounds(): void
    {
        $this->seedZone();
        $this->seedHistory('westlands');

        $r = $this->getJson('/api/v1/zones/westlands/forecast?horizon=7');
        $r->assertOk()->assertJsonPath('horizon', 7);
        $this->assertCount(7, $r->json('points'));
    }

    public function test_horizon_over_cap_returns_422(): void
    {
        $this->seedZone();
        $r = $this->getJson('/api/v1/zones/westlands/forecast?horizon=90');
        $r->assertStatus(422);
    }

    public function test_unknown_zone_returns_404(): void
    {
        $r = $this->getJson('/api/v1/zones/nowhere/forecast');
        $r->assertNotFound();
    }

    public function test_bounds_are_clamped_0_to_100(): void
    {
        $this->seedZone();
        $this->seedHistory('westlands');

        $r = $this->getJson('/api/v1/zones/westlands/forecast?horizon=14');
        foreach ($r->json('points') as $p) {
            $this->assertGreaterThanOrEqual(0, $p['lower']);
            $this->assertLessThanOrEqual(100, $p['upper']);
            $this->assertGreaterThanOrEqual($p['lower'], $p['score']);
            $this->assertLessThanOrEqual($p['upper'], $p['score']);
        }
    }

    public function test_sparse_history_flatlines(): void
    {
        $this->seedZone();
        // Only 2 snapshots — under the "need >= 3" gate.
        $early = PillarSeeding::columns([
            'water_sanitation' => 80, 'road_density' => 71, 'transit_access' => 65, 'electricity_access' => 78,
        ]);
        $late = PillarSeeding::columns([
            'water_sanitation' => 82, 'road_density' => 71, 'transit_access' => 64, 'electricity_access' => 80,
        ]);
        ZoneScoreSnapshot::create(array_merge([
            'zone_id' => 'westlands',
            'captured_at' => now()->subDay(),
            'score' => 74,
        ], $early));
        ZoneScoreSnapshot::create(array_merge([
            'zone_id' => 'westlands',
            'captured_at' => now(),
            'score' => 76,
        ], $late));

        $r = $this->getJson('/api/v1/zones/westlands/forecast?horizon=5');
        $r->assertOk();
        $scores = array_column($r->json('points'), 'score');
        // Flat line so every point should have the same value.
        $this->assertCount(1, array_unique($scores));
    }
}
