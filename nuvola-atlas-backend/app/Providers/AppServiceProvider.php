<?php

namespace App\Providers;

use App\Enums\Role;
use App\Models\Alert;
use App\Models\Report;
use App\Models\User;
use App\Models\ZoneLayer;
use App\Observers\AuditableObserver;
use App\Observers\ZoneLayerObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        JsonResource::withoutWrapping();
        ZoneLayer::observe(ZoneLayerObserver::class);

        // Append-only audit trail on user-driven writes.
        Report::observe(AuditableObserver::class);
        Alert::observe(AuditableObserver::class);

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Auth-IP throttle (§9.8): 10 attempts per 10-minute rolling window
        // per IP. Caps brute-force attempts on /sign-in, /register,
        // /forgot-password, /reset-password, and /auth/2fa/verify well below
        // a useful guess rate (60/hr ceiling) while leaving headroom for a
        // real user fat-fingering a password or reset code.
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinutes(10, 10)->by($request->ip());
        });

        // Role gates — controllers/blade can call `Gate::allows('edit-internal')`
        // and stay decoupled from the underlying role tiers.
        Gate::define('edit-internal', fn (User $user) => $user->role()->canEditInternal());
        Gate::define('manage-users', fn (User $user) => $user->role()->canManageUsers());
    }
}
