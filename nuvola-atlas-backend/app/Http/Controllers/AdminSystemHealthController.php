<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\DataIngestionLog;
use Illuminate\Database\Migrations\Migrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

/**
 * Operator telemetry for the admin console.
 *
 * Deliberately separate from `/api/health`, which stays a thin unauthenticated
 * liveness probe for uptime monitors. Queue depth, migration state and
 * ingestion recency describe the inside of the system and sit behind
 * role=admin + 2FA like everything else under /admin.
 *
 * Every check reports one of four statuses. `not_monitored` is the important
 * one: it means the number cannot be obtained from inside this process, and it
 * renders as a dash rather than a plausible figure. 30-day uptime needs an
 * external prober; Sentry's error rate needs the Sentry API and a read token.
 * The panel used to state both as fact.
 */
class AdminSystemHealthController extends Controller
{
    private const LATENCY_SAMPLES = 5;

    public function index(Migrator $migrator): JsonResponse
    {
        // Short TTL: long enough that a polling dashboard does not run five
        // round-trips a second, short enough to stay useful. `measured_at`
        // ships with the payload so the panel can show its actual age
        // rather than implying the reading is instantaneous.
        $payload = Cache::remember(
            'admin.system_health.v1',
            10,
            fn (): array => $this->collect($migrator),
        );

        return response()->json(['data' => $payload]);
    }

    /** @return array<string, mixed> */
    private function collect(Migrator $migrator): array
    {
        $checks = [
            $this->database(),
            $this->queue(),
            $this->migrations($migrator),
            $this->ingestion(),
            $this->broadcasting(),
            $this->release(),
            [
                'key' => 'uptime_30d',
                'status' => 'not_monitored',
                'value' => null,
                'unit' => null,
                'detail' => 'Needs an external prober; nothing inside the app can measure its own downtime.',
            ],
            [
                'key' => 'error_rate_24h',
                'status' => 'not_monitored',
                'value' => null,
                'unit' => null,
                'detail' => 'Sentry ingests from here but is not read back; that needs the Sentry API and a read token.',
            ],
        ];

        return [
            'checks' => $checks,
            'measured_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Connectivity plus the median of a small burst of round-trips.
     *
     * This is app→database round-trip time sampled right now, not a p50 over
     * production traffic — the detail string says so, because a bare "8 ms"
     * next to the word p50 implies a percentile over a window nobody is
     * computing.
     *
     * @return array<string, mixed>
     */
    private function database(): array
    {
        try {
            $samples = [];
            for ($i = 0; $i < self::LATENCY_SAMPLES; $i++) {
                $start = hrtime(true);
                DB::select('SELECT 1');
                $samples[] = (hrtime(true) - $start) / 1_000_000;
            }
            sort($samples);
            $median = $samples[intdiv(count($samples), 2)];

            return [
                'key' => 'database',
                'status' => 'ok',
                'value' => round($median, 2),
                'unit' => 'ms',
                'detail' => sprintf(
                    'Median of %d SELECT 1 round-trips sampled now, driver %s.',
                    self::LATENCY_SAMPLES,
                    DB::connection()->getDriverName(),
                ),
            ];
        } catch (\Throwable $e) {
            return [
                'key' => 'database',
                'status' => 'down',
                'value' => null,
                'unit' => null,
                'detail' => $e->getMessage(),
            ];
        }
    }

    /** @return array<string, mixed> */
    private function queue(): array
    {
        try {
            $depth = Queue::size();
            $failed = (int) DB::table('failed_jobs')->count();

            return [
                'key' => 'queue_depth',
                'status' => $failed > 0 ? 'degraded' : 'ok',
                'value' => $depth,
                'unit' => 'jobs',
                'detail' => sprintf(
                    '%s connection; %d failed job(s) on record.',
                    config('queue.default'),
                    $failed,
                ),
            ];
        } catch (\Throwable $e) {
            return [
                'key' => 'queue_depth',
                'status' => 'down',
                'value' => null,
                'unit' => null,
                'detail' => $e->getMessage(),
            ];
        }
    }

    /** @return array<string, mixed> */
    private function migrations(Migrator $migrator): array
    {
        try {
            $ran = $migrator->getRepository()->getRan();
            $files = $migrator->getMigrationFiles($migrator->paths() ?: [database_path('migrations')]);
            $pending = array_diff(array_keys($files), $ran);

            return [
                'key' => 'migrations',
                'status' => count($pending) === 0 ? 'ok' : 'degraded',
                'value' => count($pending),
                'unit' => 'pending',
                'detail' => count($pending) === 0
                    ? sprintf('All %d migrations applied.', count($files))
                    : 'Pending: '.implode(', ', array_slice($pending, 0, 5)),
            ];
        } catch (\Throwable $e) {
            return [
                'key' => 'migrations',
                'status' => 'down',
                'value' => null,
                'unit' => null,
                'detail' => $e->getMessage(),
            ];
        }
    }

    /**
     * Last accepted batch. Reads `arrived_at` and excludes smoke batches for
     * the same reasons `/api/health/intake` does — `received_at` is
     * caller-supplied and is the one field a misconfigured publisher could
     * use to fake freshness.
     *
     * @return array<string, mixed>
     */
    private function ingestion(): array
    {
        try {
            $last = DataIngestionLog::query()
                ->excludingSmoke()
                ->where('accepted', true)
                ->max('arrived_at');

            if ($last === null) {
                return [
                    'key' => 'last_ingestion',
                    'status' => 'degraded',
                    'value' => null,
                    'unit' => null,
                    'detail' => 'No accepted batch has ever arrived.',
                ];
            }

            $at = Carbon::parse($last);
            $minutes = (int) floor((now()->getTimestamp() - $at->getTimestamp()) / 60);
            $stallAfter = (int) config('ingestion.stall_after_minutes');

            return [
                'key' => 'last_ingestion',
                'status' => $minutes > $stallAfter ? 'degraded' : 'ok',
                'value' => $at->toIso8601String(),
                'unit' => 'timestamp',
                'detail' => sprintf(
                    '%d minute(s) ago; considered stalled past %d.',
                    $minutes,
                    $stallAfter,
                ),
            ];
        } catch (\Throwable $e) {
            return [
                'key' => 'last_ingestion',
                'status' => 'down',
                'value' => null,
                'unit' => null,
                'detail' => $e->getMessage(),
            ];
        }
    }

    /**
     * The configured driver, not a live connection count. Reverb's open-socket
     * count is only available over its own HTTP API, and a health endpoint
     * should not block on an outbound call to another service.
     *
     * @return array<string, mixed>
     */
    private function broadcasting(): array
    {
        $driver = (string) config('broadcasting.default');

        return [
            'key' => 'broadcasting',
            'status' => $driver === 'null' ? 'degraded' : 'not_monitored',
            'value' => null,
            'unit' => null,
            'detail' => $driver === 'null'
                ? 'BROADCAST_CONNECTION is null — live map updates are not being sent.'
                : sprintf('Driver "%s" configured. Open-socket count needs the Reverb API.', $driver),
        ];
    }

    /** @return array<string, mixed> */
    private function release(): array
    {
        $release = config('sentry.release');

        return [
            'key' => 'release',
            'status' => $release ? 'ok' : 'not_monitored',
            'value' => $release,
            'unit' => null,
            'detail' => $release
                ? 'From SENTRY_RELEASE, set at deploy time.'
                : 'SENTRY_RELEASE is unset, so the running build cannot identify itself.',
        ];
    }
}
