<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\DataIngestionLog;
use App\Models\Zone;
use App\Models\ZoneScoreSnapshot;
use Illuminate\Console\Command;
use Illuminate\Contracts\Http\Kernel as HttpKernel;
use Illuminate\Http\Request;

/**
 * End-to-end proof of the ingestion channel without Daystar (Phase B).
 *
 * Builds a Daystar-shaped batch, signs it exactly as
 * nuvola-atlas-ingestion/app/signing.py does, and drives it through this
 * app's own HTTP kernel — so the signature check, the batch validator, the
 * Daystar-to-column key mapping, the idempotency hash, the append-only log
 * write and the queued rescore all execute for real. No running web server
 * and no live feed required.
 *
 * The zone is restored afterwards, including the snapshot row the rescore
 * wrote, so a smoke run leaves no mark on the trend chart. The ingestion
 * log row does survive — it is append-only by design, and a record that
 * someone tested the channel is worth keeping.
 */
class IngestSmoke extends Command
{
    protected $signature = 'nuvola:ingest-smoke
        {--zone= : Zone id to exercise; defaults to the first zone}
        {--wait=15 : Seconds to wait for a queue worker to apply the rescore}
        {--keep : Leave the synthetic readings in place instead of restoring}';

    protected $description = 'Push a synthetic signed batch through ingest → score → broadcast to prove the pipeline works.';

    /** Chosen to span three pillars, and to exercise the Daystar key alias. */
    private const READINGS = [
        'healthcare_access',
        'emergency_response',
        'road_quality',
    ];

    public function handle(HttpKernel $kernel): int
    {
        $secret = (string) (config('services.ingest.secret') ?: config('ingestion.internal_secret', ''));

        if ($secret === '') {
            $this->error('No ingestion secret configured. Set INGESTION_INTERNAL_SECRET first.');

            return self::FAILURE;
        }

        $zone = $this->resolveZone();

        if ($zone === null) {
            $this->error('No zone to exercise. Seed at least one zone first.');

            return self::FAILURE;
        }

        $before = $this->capture($zone);
        $snapshotWatermark = (int) ZoneScoreSnapshot::where('zone_id', $zone->id)->max('id');

        $body = $this->buildBatch($zone, $before);
        $this->line("Zone <info>{$zone->id}</info>, score before <info>{$before['score']}</info>");

        $response = $kernel->handle($this->signedRequest($body, $secret));
        $status = $response->getStatusCode();
        $decoded = json_decode((string) $response->getContent(), true);

        if ($status !== 200) {
            $this->error("Ingest rejected the batch with HTTP {$status}.");
            $this->line((string) $response->getContent());

            return self::FAILURE;
        }

        $this->line('Signed batch accepted, HTTP 200.');

        $log = DataIngestionLog::find($decoded['log_id'] ?? 0);

        if ($log === null || ! $log->accepted) {
            $this->error('Ingest answered 200 but wrote no accepted log row.');

            return self::FAILURE;
        }

        $this->line("Log #{$log->id} written, {$log->indicators_updated} indicators applied.");

        $landed = $this->verifyReadings($zone, $body['readings']);

        if ($landed !== null) {
            $this->error($landed);
            $this->restore($zone, $before, $snapshotWatermark);

            return self::FAILURE;
        }

        $this->line('All synthetic readings landed on the zone row.');

        $rescored = $this->awaitRescore($zone, $snapshotWatermark, (int) $this->option('wait'));

        if (! $rescored) {
            $this->warn('No rescore snapshot appeared. Is a queue worker running for '.config('queue.default').'?');
            $this->restore($zone, $before, $snapshotWatermark);

            return self::FAILURE;
        }

        $zone->refresh();
        $this->line("Rescored: <info>{$before['score']}</info> → <info>{$zone->score}</info>");

        if ($this->option('keep')) {
            $this->warn('Synthetic readings left in place (--keep). Restore them before anyone reads this zone.');
        } else {
            $this->restore($zone, $before, $snapshotWatermark);
            $this->line('Zone restored to its pre-smoke state.');
        }

        $this->info('Ingestion pipeline is healthy end to end.');

        return self::SUCCESS;
    }

    private function resolveZone(): ?Zone
    {
        $id = $this->option('zone');

        return $id === null
            ? Zone::query()->orderBy('id')->first()
            : Zone::find($id);
    }

    /**
     * @return array{score: int, last_sync_min: ?int, indicators: array<string, ?int>}
     */
    private function capture(Zone $zone): array
    {
        $indicators = [];
        foreach (self::READINGS as $slug) {
            $column = 'indicator_'.$this->toColumnSlug($slug);
            $indicators[$column] = $zone->getAttribute($column);
        }

        return [
            'score' => (int) $zone->score,
            'last_sync_min' => $zone->last_sync_min,
            'indicators' => $indicators,
        ];
    }

    /**
     * @param  array{score: int, last_sync_min: ?int, indicators: array<string, ?int>}  $before
     * @return array{batch_id: string, submitted_at: string, readings: list<array<string, mixed>>}
     */
    private function buildBatch(Zone $zone, array $before): array
    {
        $now = now();
        $readings = [];

        foreach (self::READINGS as $slug) {
            $current = $before['indicators']['indicator_'.$this->toColumnSlug($slug)];

            // Mirror the current reading so the write is always observable,
            // with a nudge for the one value that mirrors onto itself.
            $value = 100 - ($current ?? 50);
            if ($value === $current) {
                $value = 51;
            }

            $readings[] = [
                'zone_id' => $zone->id,
                'indicator' => $slug,
                'value' => $value,
                'observed_at' => $now->toIso8601String(),
                'field_verified' => false,
            ];
        }

        return [
            'batch_id' => DataIngestionLog::SMOKE_SOURCE_PREFIX.$now->format('Ymd\THis\Z').'-'.bin2hex(random_bytes(4)),
            'submitted_at' => $now->toIso8601String(),
            'readings' => $readings,
        ];
    }

    /**
     * @param  array{batch_id: string, submitted_at: string, readings: list<array<string, mixed>>}  $body
     */
    private function signedRequest(array $body, string $secret): Request
    {
        $json = json_encode($body, JSON_THROW_ON_ERROR);
        $timestamp = (string) time();

        return Request::create('/api/v1/ingest', 'POST', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
            'HTTP_X_INTERNAL_SECRET' => $secret,
            'HTTP_X_INTERNAL_TIMESTAMP' => $timestamp,
            'HTTP_X_INTERNAL_SIGNATURE' => 'sha256='.hash_hmac('sha256', $timestamp.'.'.$json, $secret),
        ], $json);
    }

    /**
     * @param  list<array<string, mixed>>  $readings
     * @return string|null a description of the first mismatch, or null when all landed
     */
    private function verifyReadings(Zone $zone, array $readings): ?string
    {
        $zone->refresh();

        foreach ($readings as $reading) {
            $column = 'indicator_'.$this->toColumnSlug((string) $reading['indicator']);
            $actual = $zone->getAttribute($column);

            if ((int) $actual !== (int) $reading['value']) {
                return "Reading for {$reading['indicator']} did not land: expected {$reading['value']}, found ".var_export($actual, true).'.';
            }
        }

        return null;
    }

    private function awaitRescore(Zone $zone, int $watermark, int $wait): bool
    {
        $deadline = microtime(true) + max($wait, 0);

        do {
            if (ZoneScoreSnapshot::where('zone_id', $zone->id)->where('id', '>', $watermark)->exists()) {
                return true;
            }

            usleep(250_000);
        } while (microtime(true) < $deadline);

        return false;
    }

    /**
     * @param  array{score: int, last_sync_min: ?int, indicators: array<string, ?int>}  $before
     */
    private function restore(Zone $zone, array $before, int $watermark): void
    {
        $zone->forceFill($before['indicators'] + [
            'score' => $before['score'],
            'last_sync_min' => $before['last_sync_min'],
        ])->save();

        ZoneScoreSnapshot::where('zone_id', $zone->id)->where('id', '>', $watermark)->delete();
    }

    /**
     * Daystar publishes `emergency_response`; the column is
     * `indicator_emergency_response_access`. IngestController maps it on the
     * way in, so the smoke check has to map it the same way to verify.
     */
    private function toColumnSlug(string $indicator): string
    {
        return $indicator === 'emergency_response' ? 'emergency_response_access' : $indicator;
    }
}
