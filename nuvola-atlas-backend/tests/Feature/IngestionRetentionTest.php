<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Phase C retention. `data_ingestion_logs` stays append-only, with one
 * carve-out: the nightly sweep may drop the raw third-party payload off
 * rows past the retention window. Everything that carries analytical
 * meaning must survive that sweep, and no other mutation may get through.
 */
class IngestionRetentionTest extends TestCase
{
    private function log(string $source, int $ageDays, array $overrides = []): int
    {
        $received = now()->subDays($ageDays);

        return DB::table('data_ingestion_logs')->insertGetId(array_merge([
            'source' => $source,
            'payload_hash' => hash('sha256', $source),
            'payload' => json_encode(['raw' => 'daystar body', 'source' => $source]),
            'accepted' => true,
            'indicators_updated' => 3,
            'status' => 'applied',
            'received_at' => $received,
            'arrived_at' => $received,
            'created_at' => $received,
            'updated_at' => $received,
        ], $overrides));
    }

    public function test_payloads_past_the_window_are_redacted_and_recent_ones_are_kept(): void
    {
        $old = $this->log('daystar-old', 45);
        $fresh = $this->log('daystar-fresh', 5);

        $this->artisan('nuvola:prune-ingestion-payloads')->assertSuccessful();

        $oldRow = DB::table('data_ingestion_logs')->find($old);
        $this->assertNull($oldRow->payload);
        $this->assertNotNull($oldRow->payload_purged_at);

        $freshRow = DB::table('data_ingestion_logs')->find($fresh);
        $this->assertNotNull($freshRow->payload);
        $this->assertNull($freshRow->payload_purged_at);
    }

    public function test_redaction_leaves_the_analytical_outcome_intact(): void
    {
        $id = $this->log('daystar-outcome', 45, [
            'accepted' => true,
            'indicators_updated' => 7,
            'status' => 'applied',
            'zone_count' => 4,
        ]);

        $this->artisan('nuvola:prune-ingestion-payloads')->assertSuccessful();

        $row = DB::table('data_ingestion_logs')->find($id);
        $this->assertTrue($row->accepted);
        $this->assertSame(7, (int) $row->indicators_updated);
        $this->assertSame('applied', $row->status);
        $this->assertSame(4, (int) $row->zone_count);
        $this->assertSame(hash('sha256', 'daystar-outcome'), $row->payload_hash);
    }

    public function test_a_second_sweep_does_not_re_stamp_an_already_purged_row(): void
    {
        $id = $this->log('daystar-idempotent', 45);

        $this->artisan('nuvola:prune-ingestion-payloads')->assertSuccessful();
        $firstStamp = DB::table('data_ingestion_logs')->find($id)->payload_purged_at;

        $this->artisan('nuvola:prune-ingestion-payloads')
            ->expectsOutputToContain('Redacted 0 ingestion payloads')
            ->assertSuccessful();

        $this->assertSame($firstStamp, DB::table('data_ingestion_logs')->find($id)->payload_purged_at);
    }

    public function test_deletes_are_still_blocked_by_the_database(): void
    {
        $id = $this->log('daystar-delete', 45);

        $this->expectException(QueryException::class);
        DB::table('data_ingestion_logs')->where('id', $id)->delete();
    }

    public function test_an_update_that_is_not_a_retention_redaction_is_still_blocked(): void
    {
        $id = $this->log('daystar-tamper', 45);

        $this->expectException(QueryException::class);
        DB::table('data_ingestion_logs')->where('id', $id)->update(['status' => 'rejected']);
    }

    public function test_dropping_the_payload_without_stamping_the_purge_is_blocked(): void
    {
        $id = $this->log('daystar-halfway', 45);

        // A redaction that forgets the audit stamp would erase evidence with
        // no record that it happened — the trigger requires both halves.
        $this->expectException(QueryException::class);
        DB::table('data_ingestion_logs')->where('id', $id)->update(['payload' => null]);
    }

    public function test_a_shorter_window_can_be_passed_explicitly(): void
    {
        $id = $this->log('daystar-short-window', 10);

        $this->artisan('nuvola:prune-ingestion-payloads', ['--days' => 7])->assertSuccessful();

        $this->assertNull(DB::table('data_ingestion_logs')->find($id)->payload);
    }
}
