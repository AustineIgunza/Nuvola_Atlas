<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Scoring\ScoreCalculator;
use App\Models\MethodologyVersion;
use App\Models\Zone;
use App\Models\ZoneScoreSnapshot;
use App\Support\Pillars;
use Illuminate\Support\Facades\DB;
use Tests\Support\PillarSeeding;
use Tests\TestCase;

/**
 * P8 §Task 3 — every snapshot must record the methodology version it was
 * computed under. Republishing weights must NEVER silently rewrite the
 * interpretation of historical scores. The trend chart draws each dot
 * against the version alive at capture time; a v-bump adds new dots, it
 * does not repaint the old ones.
 */
class SnapshotMethodologyVersionBindingTest extends TestCase
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

    private function seedMethodologyVersion(string $version, bool $current, array $weights): MethodologyVersion
    {
        // A live version can only be current if no other row currently is
        // (partial-unique index). The seeder flips is_current off on any
        // existing current row before setting a new one.
        if ($current) {
            MethodologyVersion::query()->where('is_current', true)->update(['is_current' => false]);
        }

        return MethodologyVersion::create([
            'version' => $version,
            'weights' => $weights,
            'bands' => ['excellent' => 70, 'good' => 55],
            'is_current' => $current,
            'draft' => false,
            'changelog' => "Test seed for {$version}",
            'published_at' => now(),
        ]);
    }

    public function test_a_new_snapshot_stamps_the_current_methodology_version_id(): void
    {
        $v1 = $this->seedMethodologyVersion('1.0.0-test', true, Pillars::weights());
        $zone = $this->createTestZone();

        (new ScoreCalculator)->recalculate($zone);

        $snapshot = ZoneScoreSnapshot::query()->latest('id')->first();
        $this->assertSame($v1->id, $snapshot->methodology_version_id);
    }

    public function test_bumping_the_methodology_version_does_not_rewrite_historical_snapshots(): void
    {
        $v1 = $this->seedMethodologyVersion('1.0.0-test', true, Pillars::weights());
        $zone = $this->createTestZone();

        (new ScoreCalculator)->recalculate($zone);
        $originalId = ZoneScoreSnapshot::query()->latest('id')->first()->id;

        // Publish a v2 by seeding it as current — the historical row must
        // retain the v1 binding, not silently pick up the new pointer.
        $v2 = $this->seedMethodologyVersion('2.0.0-test', true, [
            'water_sanitation' => 0.5,
            'road_density' => 0.25,
            'transit_access' => 0.25,
            'electricity_access' => 0,
        ]);

        $historical = ZoneScoreSnapshot::find($originalId);
        $this->assertSame(
            $v1->id,
            $historical->methodology_version_id,
            'a historical snapshot must retain its original methodology binding'
        );
        $this->assertNotSame(
            $v2->id,
            $historical->methodology_version_id,
            'publishing v2 must not silently rewrite v1 snapshots'
        );
    }

    public function test_a_snapshot_written_under_v2_reads_the_v2_binding(): void
    {
        $v1 = $this->seedMethodologyVersion('1.0.0-test', true, Pillars::weights());
        $zone = $this->createTestZone();

        (new ScoreCalculator)->recalculate($zone);

        $v2 = $this->seedMethodologyVersion('2.0.0-test', true, [
            'water_sanitation' => 0.5,
            'road_density' => 0.25,
            'transit_access' => 0.25,
            'electricity_access' => 0,
        ]);

        (new ScoreCalculator)->recalculate($zone);

        $snapshots = ZoneScoreSnapshot::query()->orderBy('id')->get();
        $this->assertGreaterThanOrEqual(2, $snapshots->count());
        $this->assertSame($v1->id, $snapshots->first()->methodology_version_id);
        $this->assertSame($v2->id, $snapshots->last()->methodology_version_id);
    }

    public function test_relation_resolves_to_the_methodology_version_model(): void
    {
        $v1 = $this->seedMethodologyVersion('1.0.0-test', true, Pillars::weights());
        $zone = $this->createTestZone();

        (new ScoreCalculator)->recalculate($zone);

        $snapshot = ZoneScoreSnapshot::query()->latest('id')->first();
        $this->assertInstanceOf(MethodologyVersion::class, $snapshot->methodologyVersion);
        $this->assertSame('1.0.0-test', $snapshot->methodologyVersion->version);
    }
}
