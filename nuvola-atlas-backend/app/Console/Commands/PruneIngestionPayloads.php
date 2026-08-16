<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Support\Audit;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Retention sweep for raw ingestion payloads (Phase C).
 *
 * Drops the raw `payload` jsonb off log rows older than the retention
 * window and stamps `payload_purged_at`. The analytical outcome of every
 * row — accepted, status, indicators_updated, error_reasons, the hash —
 * survives forever; only the verbatim third-party body goes.
 *
 * Deliberately runs through the query builder rather than Eloquent:
 * DataIngestionLog blocks updates at the model level so application code
 * can never mutate a log, and this sweep is the one sanctioned exception.
 * The database trigger still adjudicates the write (see the Phase C
 * migration) — bypassing the model does not bypass append-only.
 */
class PruneIngestionPayloads extends Command
{
    protected $signature = 'nuvola:prune-ingestion-payloads {--days= : Retention window in days, defaults to ingestion.payload_retention_days}';

    protected $description = 'Redact raw ingestion payloads older than the retention window; scores and outcomes are kept indefinitely.';

    public function handle(): int
    {
        $days = (int) ($this->option('days') ?? config('ingestion.payload_retention_days'));

        if ($days < 1) {
            $this->error('Retention window must be at least 1 day.');

            return self::FAILURE;
        }

        $cutoff = now()->subDays($days);

        $purged = DB::table('data_ingestion_logs')
            ->where('received_at', '<', $cutoff)
            ->whereNotNull('payload')
            ->whereNull('payload_purged_at')
            ->update([
                'payload' => null,
                'payload_purged_at' => now(),
            ]);

        if ($purged > 0) {
            Audit::record('cron.prune_ingestion_payloads', null, null, [
                'purged' => $purged,
                'cutoff' => $cutoff->toIso8601String(),
                'retention_days' => $days,
            ]);
        }

        $this->info("Redacted {$purged} ingestion payloads older than {$days} days.");

        return self::SUCCESS;
    }
}
