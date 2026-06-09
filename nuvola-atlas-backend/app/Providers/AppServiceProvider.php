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
use Laravel\Sanctum\PersonalAccessToken;

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

        // Default per-user cap is 60/min. Partner API keys minted via the
        // admin wizard can carry their own `rate_limit_per_minute` cap, in
        // which case we throttle on the token id so a single key's burst
        // doesn't eat the budget for any other key issued to the same user.
        //
        // Note on middleware order: `throttle:api` sits outside `auth:sanctum`
        // on the v1 group (so unauthed reads like /zones still get a baseline
        // cap), which means $request->user() is null here for bearer-token
        // requests. We peek at the bearer header directly via Sanctum's
        // findToken() lookup so per-key caps still apply.
        RateLimiter::for('api', function (Request $request) {
            $token = self::partnerTokenFromRequest($request);
            if ($token !== null && $token->rate_limit_per_minute !== null) {
                return Limit::perMinute((int) $token->rate_limit_per_minute)
                    ->by('pat:'.$token->id);
            }

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

    /**
     * Resolve the PAT behind a request whether the user has already been
     * auth'd by Sanctum middleware (SPA cookie or bearer past auth:sanctum)
     * or we're sitting upstream of auth and need to look the bearer up
     * ourselves. Returns null for non-PAT contexts (anonymous, SPA session
     * without bearer header).
     */
    private static function partnerTokenFromRequest(Request $request): ?PersonalAccessToken
    {
        $user = $request->user();
        if ($user !== null && method_exists($user, 'currentAccessToken')) {
            $token = $user->currentAccessToken();
            if ($token instanceof PersonalAccessToken) {
                return $token;
            }
        }

        $bearer = $request->bearerToken();
        if ($bearer === null || $bearer === '') {
            return null;
        }

        return PersonalAccessToken::findToken($bearer);
    }
}
