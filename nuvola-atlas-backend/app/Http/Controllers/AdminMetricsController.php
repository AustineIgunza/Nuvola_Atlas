<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\AuditLog;
use App\Models\Partner;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
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
}
