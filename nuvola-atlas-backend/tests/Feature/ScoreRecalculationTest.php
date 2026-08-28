<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Scoring\ScoreCalculator;
use App\Models\Zone;
use App\Models\ZoneLayer;
use App\Support\Pillars;
use Illuminate\Support\Facades\DB;
use Tests\Support\PillarSeeding;
use Tests\TestCase;

class ScoreRecalculationTest extends TestCase
{
    private function createTestZone(string $id = 'test-zone'): Zone
    {
        $pillars = PillarSeeding::columns([
            'water_sanitation' => 80,
            'road_density' => 70,
            'transit_access' => 60,
            'electricity_access' => 75,
        ]);

        $cols = implode(', ', array_keys($pillars));
        $placeholders = implode(', ', array_fill(0, count($pillars), '?'));

        DB::statement(
            "INSERT INTO zones (id, name, score, {$cols}, last_sync_min,
             centroid, created_at, updated_at)
             VALUES (?, ?, 0, {$placeholders}, 99,
             ST_GeogFromText('POINT(36.82 -1.29)'), now(), now())",
            array_merge([$id, 'Test Zone'], array_values($pillars))
        );

        return Zone::find($id);
    }

    public function test_score_calculator_recalculates_zone(): void
    {
        $zone = $this->createTestZone();
        $calculator = new ScoreCalculator;

        $calculator->recalculate($zone);

        $zone->refresh();
        $this->assertGreaterThan(0, $zone->score);
        $this->assertSame(0, $zone->last_sync_min);
    }

    public function test_artisan_command_recomputes_the_weighted_composite(): void
    {
        $this->createTestZone();

        $this->artisan('atlas:recalculate-scores', ['--zone' => 'test-zone'])
            ->assertSuccessful();

        $zone = Zone::find('test-zone');
        // 0.4·80 + 0.3·70 + 0.3·60 = 71. Electricity is held at weight 0, so
        // its 75 is reported but does not enter the composite.
        $this->assertSame(71, $zone->score);
    }

    public function test_zone_layer_observer_dispatches_recalculation(): void
    {
        $zone = $this->createTestZone('observer-zone');

        // Creating a layer triggers the observer, which dispatches RecalculateZoneScore
        // In test mode, queue is sync so it runs immediately
        ZoneLayer::create([
            'zone_id' => 'observer-zone',
            'layer_type' => 'road_density',
            'geojson' => ['type' => 'FeatureCollection', 'features' => []],
        ]);

        $zone->refresh();
        $this->assertGreaterThan(0, $zone->score);
    }

    public function test_methodology_endpoint_exposes_the_registry(): void
    {
        $response = $this->getJson('/api/v1/vitality/methodology');

        $response->assertOk()
            ->assertJsonStructure(['version', 'pillars', 'weights'])
            ->assertJsonPath('version', Pillars::version())
            ->assertJsonPath('weights.water_sanitation', 0.4)
            // Held, so it is reported at zero weight rather than omitted —
            // JSON has no float zero, hence the int.
            ->assertJsonPath('weights.electricity_access', 0);
    }

    public function test_methodology_endpoint_names_no_retired_pillar(): void
    {
        $weights = $this->getJson('/api/v1/vitality/methodology')->json('weights');

        $this->assertSame([], array_intersect(array_keys($weights), Pillars::retiredKeys()));
    }
}
