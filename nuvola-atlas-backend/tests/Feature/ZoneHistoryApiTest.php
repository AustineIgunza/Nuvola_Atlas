<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Zone;
use App\Models\ZoneScoreSnapshot;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Tests\Support\PillarSeeding;
use Tests\TestCase;

class ZoneHistoryApiTest extends TestCase
{
    private function seedZone(string $id = 'westlands', string $name = 'Westlands'): Zone
    {
        $zone = Zone::create(array_merge([
            'id' => $id,
            'name' => $name,
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
            [$id]
        );

        return $zone;
    }

    private function seedSnapshots(string $zoneId, int $hoursBack, int $count): void
    {
        $now = CarbonImmutable::now();
        $stepHours = max(1, (int) floor($hoursBack / $count));

        for ($i = 0; $i < $count; $i++) {
            // Snapshots carry the same pillar columns as zones. Vary each by a
            // small offset so we get a bit of curve on the trend charts.
            $pillars = PillarSeeding::columns([
                'water_sanitation' => 80 + ($i % 3),
                'road_density' => 70 + ($i % 4),
                'transit_access' => 65 + ($i % 3),
                'electricity_access' => 78 + ($i % 5),
            ]);

            ZoneScoreSnapshot::create(array_merge([
                'zone_id' => $zoneId,
                'captured_at' => $now->subHours($i * $stepHours),
                'score' => 70 + ($i % 5),
            ], $pillars));
        }
    }

    public function test_default_range_returns_weekly_daily_points(): void
    {
        $zone = $this->seedZone();
        // 7 daily snapshots spread across the last 7 days (one per day).
        $this->seedSnapshots($zone->id, hoursBack: 24 * 7, count: 7);

        $response = $this->getJson('/api/v1/zones/westlands/history');

        $response->assertOk()
            ->assertJsonPath('range', 'week')
            ->assertJsonStructure([
                'range',
                'points' => [
                    '*' => ['t', 'score', 'pillars' => ['water_sanitation', 'road_density', 'transit_access', 'electricity_access']],
                ],
            ]);
    }

    public function test_range_day_returns_hourly_points(): void
    {
        $zone = $this->seedZone();
        $this->seedSnapshots($zone->id, hoursBack: 24, count: 24);

        $response = $this->getJson('/api/v1/zones/westlands/history?range=day');

        $response->assertOk()
            ->assertJsonPath('range', 'day');

        $points = $response->json('points');
        $this->assertGreaterThan(0, count($points));
        $this->assertLessThanOrEqual(24, count($points));
    }

    public function test_range_month_returns_up_to_30_daily_points(): void
    {
        $zone = $this->seedZone();
        $this->seedSnapshots($zone->id, hoursBack: 24 * 30, count: 30);

        $response = $this->getJson('/api/v1/zones/westlands/history?range=month');

        $response->assertOk()
            ->assertJsonPath('range', 'month');

        $points = $response->json('points');
        $this->assertLessThanOrEqual(30, count($points));
        $this->assertGreaterThan(0, count($points));
    }

    public function test_invalid_range_returns_422(): void
    {
        $this->seedZone();

        $response = $this->getJson('/api/v1/zones/westlands/history?range=year');

        $response->assertStatus(422);
    }

    public function test_unknown_zone_returns_404(): void
    {
        $response = $this->getJson('/api/v1/zones/nonexistent/history');

        $response->assertNotFound();
    }

    public function test_points_have_valid_score_bounds(): void
    {
        $zone = $this->seedZone();
        $this->seedSnapshots($zone->id, hoursBack: 24, count: 5);

        $response = $this->getJson('/api/v1/zones/westlands/history?range=day');

        $points = $response->json('points');
        foreach ($points as $point) {
            $this->assertGreaterThanOrEqual(0, $point['score']);
            $this->assertLessThanOrEqual(100, $point['score']);
            foreach ($point['pillars'] as $value) {
                $this->assertGreaterThanOrEqual(0, $value);
                $this->assertLessThanOrEqual(100, $value);
            }
        }
    }
}
