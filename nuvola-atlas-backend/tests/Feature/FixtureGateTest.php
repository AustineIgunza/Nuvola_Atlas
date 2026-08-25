<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Models\Zone;
use App\Services\ScoreCalculator;
use App\Support\DataProvenance;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * The fixture gate — R2 §P7.3.
 *
 * A zone whose composite score traces to seeded fixtures must not be
 * exportable, must not appear on the public listing, and its individual
 * detail route must 404 for anyone without an admin/editor role. Every
 * response that DOES return a fixture zone carries the flag so the
 * frontend can render a "Demo data" treatment.
 *
 * The failure mode this exists to prevent: publishing a low score for
 * Kibra or Mathare computed from seeded data. Read the comment on
 * App\Support\DataProvenance before weakening any assertion here.
 */
class FixtureGateTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function viewer(): User
    {
        return User::factory()->create(['role' => 'viewer']);
    }

    public function test_public_listing_excludes_fixture_zones(): void
    {
        Zone::factory()->create(['id' => 'real-one', 'name' => 'Real Sub-County']);
        Zone::factory()->fixture()->create(['id' => 'demo-one', 'name' => 'Demo Sub-County']);

        $body = $this->getJson('/api/v1/zones')->assertOk()->json();
        $ids = collect($body['data'])->pluck('id')->all();

        $this->assertContains('real-one', $ids);
        $this->assertNotContains('demo-one', $ids,
            'Fixture zone appeared on the public listing — the gate did not fire.');
    }

    public function test_public_listing_excludes_mixed_zones(): void
    {
        Zone::factory()->create(['id' => 'real-one']);
        Zone::factory()->mixed()->create(['id' => 'mixed-one']);

        $body = $this->getJson('/api/v1/zones')->assertOk()->json();
        $ids = collect($body['data'])->pluck('id')->all();

        // Mixed is treated as fixture for gating: a composite that folds
        // demo values in with measured ones is not measurement.
        $this->assertNotContains('mixed-one', $ids);
    }

    public function test_admin_sees_fixture_zones_with_the_flag_attached(): void
    {
        Zone::factory()->fixture()->create(['id' => 'demo-one']);

        $this->actingAs($this->admin());
        $body = $this->getJson('/api/v1/zones')->assertOk()->json();
        $rows = collect($body['data']);

        $demo = $rows->firstWhere('id', 'demo-one');
        $this->assertNotNull($demo, 'Admin listing must include fixture zones.');
        $this->assertSame(DataProvenance::FIXTURE, $demo['dataProvenance']);
    }

    public function test_viewer_role_does_not_see_fixture_zones(): void
    {
        Zone::factory()->fixture()->create(['id' => 'demo-one']);

        $this->actingAs($this->viewer());
        $body = $this->getJson('/api/v1/zones')->assertOk()->json();
        $ids = collect($body['data'])->pluck('id')->all();

        $this->assertNotContains('demo-one', $ids,
            'Viewer role is not the admin/editor tier and must not see demo data.');
    }

    public function test_detail_route_returns_404_for_fixture_zone_without_role(): void
    {
        Zone::factory()->fixture()->create(['id' => 'demo-one']);

        // 404, not 403 — 403 would confirm the zone exists, and even that
        // leaks the fixture set to a public caller.
        $this->getJson('/api/v1/zones/demo-one')->assertNotFound();
    }

    public function test_detail_route_returns_the_zone_for_admin_with_the_flag(): void
    {
        Zone::factory()->fixture()->create(['id' => 'demo-one', 'name' => 'Demo Sub-County']);

        $this->actingAs($this->admin());
        $body = $this->getJson('/api/v1/zones/demo-one')->assertOk()->json();

        $this->assertSame('demo-one', $body['id']);
        $this->assertSame(DataProvenance::FIXTURE, $body['dataProvenance']);
    }

    public function test_export_is_forbidden_for_a_fixture_zone(): void
    {
        Zone::factory()->fixture()->create(['id' => 'demo-one']);

        // Even an admin cannot export a fixture score. A signed PDF of a
        // demo number is exactly the artefact the gate exists to stop
        // leaving the system.
        $this->actingAs($this->admin())
            ->get('/api/v1/zones/demo-one/export?format=txt')
            ->assertStatus(403);
    }

    public function test_export_is_forbidden_for_a_mixed_zone(): void
    {
        Zone::factory()->mixed()->create(['id' => 'mixed-one']);

        $this->actingAs($this->admin())
            ->get('/api/v1/zones/mixed-one/export?format=txt')
            ->assertStatus(403);
    }

    public function test_export_succeeds_for_a_measured_zone(): void
    {
        Zone::factory()->create(['id' => 'real-one']);

        $r = $this->actingAs($this->admin())
            ->get('/api/v1/zones/real-one/export?format=txt')
            ->assertOk();
        $this->assertStringContainsString('Vitality Score', $r->getContent());
    }

    public function test_zone_resource_always_carries_the_provenance_flag(): void
    {
        Zone::factory()->create(['id' => 'real-one']);

        $body = $this->getJson('/api/v1/zones')->assertOk()->json();
        $row = collect($body['data'])->firstWhere('id', 'real-one');

        $this->assertArrayHasKey('dataProvenance', $row);
        $this->assertSame(DataProvenance::MEASURED, $row['dataProvenance']);
    }

    public function test_score_calculator_reports_provenance_from_the_row(): void
    {
        $zone = Zone::factory()->fixture()->create();

        $this->assertSame(
            DataProvenance::FIXTURE,
            (new ScoreCalculator)->dataProvenance($zone->fresh())
        );
    }

    public function test_a_row_with_missing_or_bogus_provenance_reads_as_fixture(): void
    {
        // Silent fallback to 'measured' would be the accident this whole
        // feature exists to prevent. An unknown value fails safe to fixture.
        $zone = Zone::factory()->create();
        $zone->forceFill(['data_provenance' => 'nonsense'])->save();

        $this->assertSame(
            DataProvenance::FIXTURE,
            (new ScoreCalculator)->dataProvenance($zone->fresh())
        );
    }
}
