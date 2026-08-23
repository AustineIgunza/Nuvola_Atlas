<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Zone;
use App\Models\ZoneScoreSnapshot;
use App\Services\PillarDeltaCalculator;
use App\Support\Pillars;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Tests\Support\PillarSeeding;
use Tests\TestCase;

/**
 * Deltas used to be hardcoded to 0, which told every reader that a zone had
 * held perfectly steady when the truth was that nothing had been measured.
 * These tests pin the distinction: a measurable window produces a number,
 * anything less produces null, and null is never rounded back down to 0.
 */
class ZoneDeltaApiTest extends TestCase
{
    /** @param array<string, ?int> $pillars */
    private function seedZone(string $id, array $pillars): Zone
    {
        $zone = Zone::create(array_merge([
            'id' => $id,
            'name' => ucfirst($id),
            'score' => 70,
            'last_sync_min' => 4,
        ], PillarSeeding::columns($pillars)));

        DB::statement(
            'UPDATE zones SET centroid = ST_MakePoint(36.8048, -1.2673)::geography WHERE id = ?',
            [$id]
        );

        return $zone;
    }

    /** @param array<string, ?int> $pillars */
    private function seedSnapshot(string $zoneId, int $daysAgo, array $pillars): ZoneScoreSnapshot
    {
        return ZoneScoreSnapshot::create(array_merge([
            'zone_id' => $zoneId,
            'captured_at' => CarbonImmutable::now()->subDays($daysAgo),
            'score' => 70,
        ], PillarSeeding::columns($pillars)));
    }

    public function test_two_snapshots_produce_deltas_against_the_oldest_baseline(): void
    {
        $this->seedZone('westlands', ['water_sanitation' => 82, 'road_density' => 71, 'transit_access' => 64, 'electricity_access' => 80]);
        $this->seedSnapshot('westlands', 30, ['water_sanitation' => 75, 'road_density' => 73, 'transit_access' => 64, 'electricity_access' => 72]);
        $this->seedSnapshot('westlands', 10, ['water_sanitation' => 79, 'road_density' => 72, 'transit_access' => 64, 'electricity_access' => 76]);

        $response = $this->getJson('/api/v1/zones/westlands');

        $response->assertOk()
            ->assertJsonPath('deltas.water_sanitation', 7)
            ->assertJsonPath('deltas.road_density', -2)
            // A pillar that genuinely did not move is the one case where 0
            // is the honest answer.
            ->assertJsonPath('deltas.transit_access', 0)
            ->assertJsonPath('deltas.electricity_access', 8)
            ->assertJsonPath('deltaWindowDays', 30);
    }

    public function test_a_single_snapshot_is_not_enough_history_for_a_delta(): void
    {
        $this->seedZone('starehe', ['water_sanitation' => 82, 'road_density' => 71, 'transit_access' => 64, 'electricity_access' => 80]);
        $this->seedSnapshot('starehe', 30, ['water_sanitation' => 60, 'road_density' => 60, 'transit_access' => 60, 'electricity_access' => 60]);

        $response = $this->getJson('/api/v1/zones/starehe');

        $response->assertOk()
            ->assertJsonPath('deltas.water_sanitation', null)
            ->assertJsonPath('deltas.road_density', null)
            ->assertJsonPath('deltas.transit_access', null)
            ->assertJsonPath('deltas.electricity_access', null)
            ->assertJsonPath('deltaWindowDays', null);
    }

    public function test_a_zone_with_no_history_reports_null_not_zero(): void
    {
        $this->seedZone('dagoretti', ['water_sanitation' => 82, 'road_density' => 71, 'transit_access' => 64, 'electricity_access' => 80]);

        $response = $this->getJson('/api/v1/zones/dagoretti');

        $response->assertOk();

        // Compared as a whole array rather than key by key, so a missing
        // `deltas` key cannot pass as a set of nulls.
        $this->assertSame(
            Pillars::fill(null),
            $response->json('deltas'),
            'deltas must be null, not 0, when there is no history'
        );
    }

    public function test_a_pillar_missing_from_the_baseline_has_no_delta_while_the_others_do(): void
    {
        $this->seedZone('kasarani', ['water_sanitation' => 82, 'road_density' => 71, 'transit_access' => 64, 'electricity_access' => 80]);
        $baseline = $this->seedSnapshot('kasarani', 40, ['road_density' => 65, 'transit_access' => 60, 'electricity_access' => 70]);
        $this->seedSnapshot('kasarani', 5, ['road_density' => 68, 'transit_access' => 62, 'electricity_access' => 74]);

        // The baseline never recorded water & sanitation, so there is no
        // value to subtract from.
        $this->assertNull($baseline->pillar_water_sanitation);

        $response = $this->getJson('/api/v1/zones/kasarani');

        $response->assertOk()
            ->assertJsonPath('deltas.water_sanitation', null)
            ->assertJsonPath('deltas.road_density', 6)
            ->assertJsonPath('deltas.transit_access', 4)
            ->assertJsonPath('deltas.electricity_access', 10);
    }

    public function test_snapshots_older_than_the_window_do_not_become_a_baseline(): void
    {
        $this->seedZone('embakasi', ['water_sanitation' => 82, 'road_density' => 71, 'transit_access' => 64, 'electricity_access' => 80]);
        $this->seedSnapshot('embakasi', PillarDeltaCalculator::WINDOW_DAYS + 30, ['water_sanitation' => 20]);
        $this->seedSnapshot('embakasi', 3, ['water_sanitation' => 79]);

        $response = $this->getJson('/api/v1/zones/embakasi');

        // Only one snapshot falls inside the window, so there is still
        // nothing to measure against.
        $response->assertOk()
            ->assertJsonPath('deltas.water_sanitation', null)
            ->assertJsonPath('deltaWindowDays', null);
    }

    public function test_the_list_endpoint_resolves_each_zone_independently(): void
    {
        $this->seedZone('westlands', ['water_sanitation' => 82, 'road_density' => 71, 'transit_access' => 64, 'electricity_access' => 80]);
        $this->seedSnapshot('westlands', 20, ['water_sanitation' => 74, 'road_density' => 71, 'transit_access' => 64, 'electricity_access' => 80]);
        $this->seedSnapshot('westlands', 4, ['water_sanitation' => 78, 'road_density' => 71, 'transit_access' => 64, 'electricity_access' => 80]);

        $this->seedZone('starehe', ['water_sanitation' => 60, 'road_density' => 60, 'transit_access' => 60, 'electricity_access' => 60]);

        $response = $this->getJson('/api/v1/zones');
        $response->assertOk();

        $byId = collect($response->json('data'))->keyBy('id');

        $this->assertSame(8, $byId['westlands']['deltas']['water_sanitation']);
        $this->assertSame(20, $byId['westlands']['deltaWindowDays']);
        $this->assertNull($byId['starehe']['deltas']['water_sanitation']);
        $this->assertNull($byId['starehe']['deltaWindowDays']);
    }
}
