<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\AuditLog;
use App\Models\Partner;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

class AdminMetricsController extends Controller
{
    /**
     * Headline KPIs for the admin dashboard.
     *
     * Cached 30s so a refreshing dashboard doesn't hammer the DB with five
     * COUNTs per second. The TTL is short enough that the numbers feel
     * live during a working session.
     */
    public function index(): JsonResponse
    {
        $payload = Cache::remember('admin.metrics.v1', 30, function (): array {
            $now = now();
            $dayAgo = $now->copy()->subDay();

            return [
                'users_total' => User::query()->count(),
                'partners_total' => Partner::query()->count(),
                'reports_total' => Report::query()->count(),
                'alerts_unread' => Alert::query()->where('read', false)->count(),
                'audit_events_last_24h' => AuditLog::query()
                    ->where('created_at', '>=', $dayAgo)
                    ->count(),
                'api_keys_active' => PersonalAccessToken::query()
                    ->where(function ($q) {
                        $q->whereJsonContains('abilities', 'api:read')
                            ->orWhereJsonContains('abilities', 'api:write');
                    })
                    ->where(function ($q) {
                        $q->whereNull('expires_at')->orWhere('expires_at', '>=', now());
                    })
                    ->count(),
                'admins_total' => User::query()->where('role', 'admin')->count(),
                'admins_with_two_factor' => User::query()
                    ->where('role', 'admin')
                    ->whereNotNull('email_two_factor_enabled_at')
                    ->count(),
                'generated_at' => $now->toIso8601String(),
            ];
        });

        return response()->json(['data' => $payload]);
    }

    /**
     * 30-day daily audit-event counts for the dashboard sparkline.
     *
     * Always returns exactly 30 entries (oldest → newest), zero-filling
     * days with no events so the sparkline keeps a stable x-axis. Cached
     * for 5 minutes since the resolution is daily anyway.
     */
    public function auditVolume(): JsonResponse
    {
        $payload = Cache::remember('admin.metrics.audit_volume.v1', 300, function (): array {
            $today = Carbon::today();
            $start = $today->copy()->subDays(29);

            $driver = DB::connection()->getDriverName();
            $dayExpr = $driver === 'pgsql'
                ? "TO_CHAR(created_at, 'YYYY-MM-DD')"
                : "DATE(created_at)";

            $rows = AuditLog::query()
                ->where('created_at', '>=', $start)
                ->selectRaw("$dayExpr AS day, COUNT(*) AS count")
                ->groupBy('day')
                ->pluck('count', 'day');

            $series = [];
            for ($i = 29; $i >= 0; $i--) {
                $date = $today->copy()->subDays($i)->toDateString();
                $series[] = ['date' => $date, 'count' => (int) ($rows[$date] ?? 0)];
            }

            return [
                'series' => $series,
                'window_days' => 30,
                'total' => array_sum(array_column($series, 'count')),
                'generated_at' => now()->toIso8601String(),
            ];
        });

        return response()->json(['data' => $payload]);
    }
}
