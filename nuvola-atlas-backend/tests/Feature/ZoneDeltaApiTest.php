<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Zone;
use App\Models\ZoneScoreSnapshot;
use App\Services\PillarDeltaCalculator;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Tests\Support\IndicatorSeeding;
use Tests\TestCase;

/**
 * Deltas used to be hardcoded to 0, which told every reader that a zone had
 * held perfectly steady when the truth was that nothing had been measured.
 * These tests pin the distinction: a measurable window produces a number,
 * anything less produces null, and null is never rounded back down to 0.
 */
class ZoneDeltaApiTest extends TestCase
{
    /** @param array{social?: int, safety?: int, density?: int, infra?: int} $pillars */
    private function seedZone(string $id, array $pillars): Zone
    {
        $zone = Zone::create(array_merge([
            'id' => $id,
            'name' => ucfirst($id),
            'score' => 70,
            'last_sync_min' => 4,
        ], IndicatorSeeding::fromPillars($pillars)));

        DB::statement(
            'UPDATE zones SET centroid = ST_MakePoint(36.8048, -1.2673)::geography WHERE id = ?',
            [$id]
        );

        return $zone;
    }

    /** @param array{social?: int, safety?: int, density?: int, infra?: int} $pillars */
    private function seedSnapshot(string $zoneId, int $daysAgo, array $pillars): ZoneScoreSnapshot
    {
        return ZoneScoreSnapshot::create(array_merge([
            'zone_id' => $zoneId,
            'captured_at' => CarbonImmutable::now()->subDays($daysAgo),
            'score' => 70,
        ], IndicatorSeeding::fromPillars($pillars)));
    }

    public function test_two_snapshots_produce_deltas_against_the_oldest_baseline(): void
    {
        $this->seedZone('westlands', ['social' => 82, 'safety' => 71, 'density' => 64, 'infra' => 80]);
        $this->seedSnapshot('westlands', 30, ['social' => 75, 'safety' => 73, 'density' => 64, 'infra' => 72]);
        $this->seedSnapshot('westlands', 10, ['social' => 79, 'safety' => 72, 'density' => 64, 'infra' => 76]);

        $response = $this->getJson('/api/v1/zones/westlands');

        $response->assertOk()
            ->assertJsonPath('deltas.social', 7)
            ->assertJsonPath('deltas.safety', -2)
            // A pillar that genuinely did not move is the one case where 0
            // is the honest answer.
            ->assertJsonPath('deltas.density', 0)
            ->assertJsonPath('deltas.infra', 8)
            ->assertJsonPath('deltaWindowDays', 30);
    }

    public function test_a_single_snapshot_is_not_enough_history_for_a_delta(): void
    {
        $this->seedZone('starehe', ['social' => 82, 'safety' => 71, 'density' => 64, 'infra' => 80]);
        $this->seedSnapshot('starehe', 30, ['social' => 60, 'safety' => 60, 'density' => 60, 'infra' => 60]);

        $response = $this->getJson('/api/v1/zones/starehe');

        $response->assertOk()
            ->assertJsonPath('deltas.social', null)
            ->assertJsonPath('deltas.safety', null)
            ->assertJsonPath('deltas.density', null)
            ->assertJsonPath('deltas.infra', null)
            ->assertJsonPath('deltaWindowDays', null);
    }

    public function test_a_zone_with_no_history_reports_null_not_zero(): void
    {
        $this->seedZone('dagoretti', ['social' => 82, 'safety' => 71, 'density' => 64, 'infra' => 80]);

        $response = $this->getJson('/api/v1/zones/dagoretti');

        $response->assertOk();

        // Compared as a whole array rather than key by key, so a missing
        // `deltas` key cannot pass as four nulls.
        $this->assertSame(
            ['social' => null, 'safety' => null, 'density' => null, 'infra' => null],
            $response->json('deltas'),
            'deltas must be null, not 0, when there is no history'
        );
    }

    public function test_a_pillar_missing_from_the_baseline_has_no_delta_while_the_others_do(): void
    {
        $this->seedZone('kasarani', ['social' => 82, 'safety' => 71, 'density' => 64, 'infra' => 80]);
        $baseline = $this->seedSnapshot('kasarani', 40, ['safety' => 65, 'density' => 60, 'infra' => 70]);
        $this->seedSnapshot('kasarani', 5, ['safety' => 68, 'density' => 62, 'infra' => 74]);

        // The baseline never recorded the social indicators, so its social
        // pillar has no value to subtract from.
        $this->assertNull($baseline->indicator_healthcare_access);

        $response = $this->getJson('/api/v1/zones/kasarani');

        $response->assertOk()
            ->assertJsonPath('deltas.social', null)
            ->assertJsonPath('deltas.safety', 6)
            ->assertJsonPath('deltas.density', 4)
            ->assertJsonPath('deltas.infra', 10);
    }

    public function test_snapshots_older_than_the_window_do_not_become_a_baseline(): void
    {
        $this->seedZone('embakasi', ['social' => 82, 'safety' => 71, 'density' => 64, 'infra' => 80]);
        $this->seedSnapshot('embakasi', PillarDeltaCalculator::WINDOW_DAYS + 30, ['social' => 20]);
        $this->seedSnapshot('embakasi', 3, ['social' => 79]);

        $response = $this->getJson('/api/v1/zones/embakasi');

        // Only one snapshot falls inside the window, so there is still
        // nothing to measure against.
        $response->assertOk()
            ->assertJsonPath('deltas.social', null)
            ->assertJsonPath('deltaWindowDays', null);
    }

    public function test_the_list_endpoint_resolves_each_zone_independently(): void
    {
        $this->seedZone('westlands', ['social' => 82, 'safety' => 71, 'density' => 64, 'infra' => 80]);
        $this->seedSnapshot('westlands', 20, ['social' => 74, 'safety' => 71, 'density' => 64, 'infra' => 80]);
        $this->seedSnapshot('westlands', 4, ['social' => 78, 'safety' => 71, 'density' => 64, 'infra' => 80]);

        $this->seedZone('starehe', ['social' => 60, 'safety' => 60, 'density' => 60, 'infra' => 60]);

        $response = $this->getJson('/api/v1/zones');
        $response->assertOk();

        $byId = collect($response->json('data'))->keyBy('id');

        $this->assertSame(8, $byId['westlands']['deltas']['social']);
        $this->assertSame(20, $byId['westlands']['deltaWindowDays']);
        $this->assertNull($byId['starehe']['deltas']['social']);
        $this->assertNull($byId['starehe']['deltaWindowDays']);
    }
}
