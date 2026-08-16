<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\DataIngestionLog;
use App\Services\Feeds\FeedStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    public function index(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'cache' => $this->checkCache(),
        ];

        $ok = collect($checks)->every(fn (array $c) => $c['ok'] === true);

        return response()->json([
            'status' => $ok ? 'ok' : 'degraded',
            'checks' => $checks,
            'timestamp' => now()->toIso8601String(),
        ], $ok ? 200 : 503);
    }

    /**
     * Intake-channel health, for uptime monitors watching the
     * FastAPI → Laravel hop specifically. `/api/health` answers "is the
     * app up"; this answers "is data still arriving". The ingestion
     * service has its own `/api/health/ingestion` covering the other end
     * of the same hop.
     *
     * Only `stalled` returns 503 — a rejected batch or an overdue feed is
     * a data-quality problem for the team to chase, not an outage, so it
     * reports `degraded` on a 200 and does not page anyone.
     *
     * Reads `arrived_at` rather than `received_at`: the legacy single-zone
     * endpoint lets the caller supply `received_at`, so it is the one
     * timestamp a misconfigured publisher could use to fake freshness.
     */
    public function intake(FeedStatusService $feeds): JsonResponse
    {
        $stallAfter = (int) config('ingestion.stall_after_minutes');
        $now = now();

        $lastArrival = DataIngestionLog::query()
            ->excludingSmoke()
            ->where('accepted', true)
            ->max('arrived_at');

        $lastBatchAt = $lastArrival === null ? null : Carbon::parse($lastArrival);
        $minutesSince = $lastBatchAt === null
            ? null
            : (int) floor(($now->getTimestamp() - $lastBatchAt->getTimestamp()) / 60);

        $since = $now->copy()->subDay();
        $recent = DataIngestionLog::query()
            ->excludingSmoke()
            ->where('arrived_at', '>=', $since)
            ->selectRaw('COUNT(*) FILTER (WHERE accepted) AS accepted')
            ->selectRaw('COUNT(*) FILTER (WHERE NOT accepted) AS rejected')
            ->first();

        $feedSummary = $feeds->matrix()['summary'];

        $stalled = $minutesSince === null || $minutesSince > $stallAfter;
        $degraded = (int) $recent->rejected > 0
            || $feedSummary['overdue'] > 0
            || $feedSummary['missing'] > 0;

        $status = match (true) {
            $stalled => 'stalled',
            $degraded => 'degraded',
            default => 'ok',
        };

        return response()->json([
            'status' => $status,
            'last_batch_at' => $lastBatchAt?->toIso8601String(),
            'minutes_since_last_batch' => $minutesSince,
            'stall_after_minutes' => $stallAfter,
            'batches_last_24h' => [
                'accepted' => (int) $recent->accepted,
                'rejected' => (int) $recent->rejected,
            ],
            'feeds' => $feedSummary,
            'timestamp' => $now->toIso8601String(),
        ], $stalled ? 503 : 200);
    }

    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo()->query('SELECT 1');

            return ['ok' => true];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    private function checkCache(): array
    {
        try {
            Cache::put('health:ping', '1', 5);

            return ['ok' => Cache::get('health:ping') === '1'];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }
}
