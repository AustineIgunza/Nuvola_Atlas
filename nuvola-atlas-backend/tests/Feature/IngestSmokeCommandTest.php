<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Jobs\RecalculateZoneScore;
use App\Models\DataIngestionLog;
use App\Models\Zone;
use App\Models\ZoneScoreSnapshot;
use App\Support\Pillars;
use Illuminate\Support\Facades\Queue;
use Tests\Support\PillarSeeding;
use Tests\TestCase;

/**
 * Phase B — nuvola:ingest-smoke has to fail loudly when the pipeline is
 * broken and leave no trace when it isn't. Both halves are load-bearing:
 * a smoke test that silently passes is worse than none, and one that
 * corrupts a real zone can't be run against production.
 */
class IngestSmokeCommandTest extends TestCase
{
    private const SECRET = 'super_secret_token_that_is_at_least_48_characters_long_for_validation';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'ingestion.internal_secret' => self::SECRET,
            'services.ingest.secret' => self::SECRET,
        ]);
    }

    public function test_it_drives_a_signed_batch_through_the_real_pipeline(): void
    {
        Zone::factory()->create(['id' => 'kasarani', 'pillar_water_sanitation' => 40]);

        $this->artisan('nuvola:ingest-smoke')
            ->assertSuccessful();

        $log = DataIngestionLog::sole();
        $this->assertTrue($log->accepted);
        // The smoke batch drives every live pillar, so a pillar landing or
        // being retired changes this number without touching the test.
        $this->assertSame(count(Pillars::keys()), $log->indicators_updated);
        $this->assertStringStartsWith(DataIngestionLog::SMOKE_SOURCE_PREFIX, $log->source);
    }

    public function test_it_restores_the_zone_and_leaves_no_snapshot_behind(): void
    {
        $zone = Zone::factory()->create(array_merge(
            ['id' => 'kasarani', 'score' => 61],
            PillarSeeding::columns([
                'water_sanitation' => 40,
                'road_density' => 55,
                'transit_access' => 70,
            ]),
        ));

        $this->artisan('nuvola:ingest-smoke')->assertSuccessful();

        $zone->refresh();
        $this->assertSame(61, $zone->score);
        $this->assertSame(40, $zone->pillar_water_sanitation);
        $this->assertSame(55, $zone->pillar_road_density);
        $this->assertSame(70, $zone->pillar_transit_access);
        $this->assertSame(0, ZoneScoreSnapshot::where('zone_id', 'kasarani')->count());
    }

    public function test_keep_leaves_the_synthetic_readings_in_place(): void
    {
        $zone = Zone::factory()->create(['id' => 'kasarani', 'pillar_water_sanitation' => 40]);

        $this->artisan('nuvola:ingest-smoke --keep')->assertSuccessful();

        // 100 - 40; the command mirrors each reading so the write is visible.
        $this->assertSame(60, $zone->refresh()->pillar_water_sanitation);
    }

    public function test_it_exercises_every_live_pillar(): void
    {
        Zone::factory()->create(array_merge(
            ['id' => 'kasarani'],
            PillarSeeding::columns(array_fill_keys(Pillars::keys(), 30)),
        ));

        $this->artisan('nuvola:ingest-smoke --keep')->assertSuccessful();

        // A pillar the smoke batch skips would stay at 30 — which is how a
        // silently unwritable column shows up as a failure here rather than
        // as a quiet gap in production.
        $zone = Zone::find('kasarani');
        foreach (Pillars::keys() as $key) {
            $this->assertSame(70, $zone->getAttribute(Pillars::column($key)), $key);
        }
    }

    public function test_it_fails_when_no_secret_is_configured(): void
    {
        config(['ingestion.internal_secret' => '', 'services.ingest.secret' => '']);
        Zone::factory()->create(['id' => 'kasarani']);

        $this->artisan('nuvola:ingest-smoke')
            ->expectsOutputToContain('No ingestion secret configured')
            ->assertFailed();
    }

    public function test_it_fails_when_there_is_no_zone_to_exercise(): void
    {
        $this->artisan('nuvola:ingest-smoke')
            ->expectsOutputToContain('No zone to exercise')
            ->assertFailed();
    }

    public function test_a_batch_that_is_never_rescored_fails_and_still_restores(): void
    {
        // Faking the queue is how a stopped worker looks from here: the
        // batch lands, the job is dispatched, and nothing ever runs it.
        Queue::fake();

        $zone = Zone::factory()->create(['id' => 'kasarani', 'pillar_water_sanitation' => 40]);

        $this->artisan('nuvola:ingest-smoke --wait=0')
            ->expectsOutputToContain('No rescore snapshot appeared')
            ->assertFailed();

        Queue::assertPushed(RecalculateZoneScore::class);
        $this->assertSame(40, $zone->refresh()->pillar_water_sanitation);
    }
}
