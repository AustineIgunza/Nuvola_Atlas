<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Jobs\RecalculateZoneScore;
use App\Models\DataIngestionLog;
use App\Models\Zone;
use App\Models\ZoneScoreSnapshot;
use Illuminate\Support\Facades\Queue;
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
        Zone::factory()->create(['id' => 'kasarani', 'indicator_healthcare_access' => 40]);

        $this->artisan('nuvola:ingest-smoke')
            ->assertSuccessful();

        $log = DataIngestionLog::sole();
        $this->assertTrue($log->accepted);
        $this->assertSame(3, $log->indicators_updated);
        $this->assertStringStartsWith(DataIngestionLog::SMOKE_SOURCE_PREFIX, $log->source);
    }

    public function test_it_restores_the_zone_and_leaves_no_snapshot_behind(): void
    {
        $zone = Zone::factory()->create([
            'id' => 'kasarani',
            'score' => 61,
            'indicator_healthcare_access' => 40,
            'indicator_emergency_response_access' => 55,
            'indicator_road_quality' => 70,
        ]);

        $this->artisan('nuvola:ingest-smoke')->assertSuccessful();

        $zone->refresh();
        $this->assertSame(61, $zone->score);
        $this->assertSame(40, $zone->indicator_healthcare_access);
        $this->assertSame(55, $zone->indicator_emergency_response_access);
        $this->assertSame(70, $zone->indicator_road_quality);
        $this->assertSame(0, ZoneScoreSnapshot::where('zone_id', 'kasarani')->count());
    }

    public function test_keep_leaves_the_synthetic_readings_in_place(): void
    {
        $zone = Zone::factory()->create(['id' => 'kasarani', 'indicator_healthcare_access' => 40]);

        $this->artisan('nuvola:ingest-smoke --keep')->assertSuccessful();

        // 100 - 40; the command mirrors each reading so the write is visible.
        $this->assertSame(60, $zone->refresh()->indicator_healthcare_access);
    }

    public function test_it_exercises_the_daystar_indicator_alias(): void
    {
        Zone::factory()->create(['id' => 'kasarani', 'indicator_emergency_response_access' => 30]);

        $this->artisan('nuvola:ingest-smoke --keep')->assertSuccessful();

        // Daystar publishes `emergency_response`; IngestController has to map
        // it onto indicator_emergency_response_access or this stays at 30.
        $this->assertSame(70, Zone::find('kasarani')->indicator_emergency_response_access);
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

        $zone = Zone::factory()->create(['id' => 'kasarani', 'indicator_healthcare_access' => 40]);

        $this->artisan('nuvola:ingest-smoke --wait=0')
            ->expectsOutputToContain('No rescore snapshot appeared')
            ->assertFailed();

        Queue::assertPushed(RecalculateZoneScore::class);
        $this->assertSame(40, $zone->refresh()->indicator_healthcare_access);
    }
}
