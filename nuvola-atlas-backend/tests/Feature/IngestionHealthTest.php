<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\DataIngestionLog;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Phase B — /api/health/ingestion answers "is data still arriving", which is
 * a different question from /api/health's "is the app up". Only silence is
 * an outage; bad data is a 200 that says so.
 */
class IngestionHealthTest extends TestCase
{
    private function log(string $source, int $minutesAgo, bool $accepted = true): void
    {
        DB::table('data_ingestion_logs')->insert([
            'source' => $source,
            'payload_hash' => hash('sha256', $source.$minutesAgo.microtime()),
            'accepted' => $accepted,
            'status' => $accepted ? 'applied' : 'rejected',
            'indicators_updated' => $accepted ? 3 : 0,
            'received_at' => now()->subMinutes($minutesAgo),
            'arrived_at' => now()->subMinutes($minutesAgo),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_a_channel_that_has_never_delivered_is_stalled(): void
    {
        $this->getJson('/api/health/ingestion')
            ->assertStatus(503)
            ->assertJsonPath('status', 'stalled')
            ->assertJsonPath('last_batch_at', null)
            ->assertJsonPath('minutes_since_last_batch', null)
            ->assertJsonPath('batches_last_24h.accepted', 0);
    }

    public function test_a_recent_accepted_batch_reports_ok(): void
    {
        $this->log('daystar', minutesAgo: 30);

        $this->getJson('/api/health/ingestion')
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('minutes_since_last_batch', 30)
            ->assertJsonPath('batches_last_24h.accepted', 1)
            ->assertJsonPath('batches_last_24h.rejected', 0)
            ->assertJsonPath('stall_after_minutes', 1440);
    }

    public function test_silence_past_the_threshold_is_stalled(): void
    {
        $this->log('daystar', minutesAgo: 1441);

        $this->getJson('/api/health/ingestion')
            ->assertStatus(503)
            ->assertJsonPath('status', 'stalled')
            ->assertJsonPath('minutes_since_last_batch', 1441)
            // Outside the 24h window, so it counts toward neither tally.
            ->assertJsonPath('batches_last_24h.accepted', 0);
    }

    public function test_a_rejected_batch_degrades_without_paging(): void
    {
        $this->log('daystar', minutesAgo: 10);
        $this->log('daystar', minutesAgo: 5, accepted: false);

        $this->getJson('/api/health/ingestion')
            ->assertOk()
            ->assertJsonPath('status', 'degraded')
            ->assertJsonPath('batches_last_24h.accepted', 1)
            ->assertJsonPath('batches_last_24h.rejected', 1);
    }

    public function test_a_smoke_batch_is_not_evidence_that_a_feed_is_alive(): void
    {
        $this->log(DataIngestionLog::SMOKE_SOURCE_PREFIX.'20260816T0900Z-abcd', minutesAgo: 1);

        $this->getJson('/api/health/ingestion')
            ->assertStatus(503)
            ->assertJsonPath('status', 'stalled')
            ->assertJsonPath('last_batch_at', null)
            ->assertJsonPath('batches_last_24h.accepted', 0);
    }

    public function test_the_stall_threshold_is_configurable(): void
    {
        config(['ingestion.stall_after_minutes' => 60]);
        $this->log('daystar', minutesAgo: 90);

        $this->getJson('/api/health/ingestion')
            ->assertStatus(503)
            ->assertJsonPath('status', 'stalled')
            ->assertJsonPath('stall_after_minutes', 60);
    }
}
