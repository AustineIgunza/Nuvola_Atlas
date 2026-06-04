<?php

namespace App\Providers;

use App\Enums\Role;
use App\Models\User;
use App\Models\ZoneLayer;
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

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // Role gates — controllers/blade can call `Gate::allows('edit-internal')`
        // and stay decoupled from the underlying role tiers.
        Gate::define('edit-internal', fn (User $user) => $user->role()->canEditInternal());
        Gate::define('manage-users', fn (User $user) => $user->role()->canManageUsers());
    }
}
