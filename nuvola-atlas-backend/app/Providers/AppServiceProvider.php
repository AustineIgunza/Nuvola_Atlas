<?php

namespace App\Providers;

use App\Enums\Role;
use App\Events\ZoneScoreUpdated;
use App\Listeners\FireAlertRulesOnZoneScoreUpdated;
use App\Models\Alert;
use App\Models\Report;
use App\Models\User;
use App\Models\ZoneLayer;
use App\Observers\AuditableObserver;
use App\Observers\ZoneLayerObserver;
use App\Services\Agents\AgentProvider;
use App\Services\Agents\Providers\HeuristicAgentProvider;
use App\Services\Agents\Providers\HuggingFaceAgentProvider;
use App\Services\Chat\SqlGuard;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\PersonalAccessToken;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // SqlGuard's allowlist + limits come from config/ai.php. Bind
        // once here so the pipeline services can resolve it via the
        // container without re-reading config on every request.
        $this->app->singleton(SqlGuard::class, fn () => new SqlGuard(
            allowedTables: config('ai.allowed_tables', []),
            defaultLimit: (int) config('ai.chat.max_result_rows', 200),
            hardLimit: (int) config('ai.chat.hard_limit', 1000),
        ));

        // AgentProvider binding — heuristic by default so every route
        // works without an LLM key. Flip AGENT_PROVIDER=huggingface once
        // an HF Inference Endpoint is wired up.
        $this->app->bind(AgentProvider::class, function ($app) {
            $provider = (string) config('services.agents.provider', 'heuristic');

            return $provider === 'huggingface'
                ? $app->make(HuggingFaceAgentProvider::class)
                : $app->make(HeuristicAgentProvider::class);
        });
    }

    public function boot(): void
    {
        JsonResource::withoutWrapping();
        ZoneLayer::observe(ZoneLayerObserver::class);

        // Append-only audit trail on user-driven writes.
        Report::observe(AuditableObserver::class);
        Alert::observe(AuditableObserver::class);

        // Automation — fire watchlist alert rules when a zone score
        // moves. Runs on the queue so a fleet-wide bulk recompute
        // (17 zones × N rules × M users) doesn't block the request path.
        Event::listen(ZoneScoreUpdated::class, FireAlertRulesOnZoneScoreUpdated::class);

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

        // Auth throttle (§9.8) — two tiers, both applied.
        //
        // Per (email + IP): mobile carrier NAT and shared Wi-Fi put many
        // users behind one egress IP, so an IP-only bucket let one person's
        // fat-fingered password lock out everyone else on the network.
        //
        // Per IP: the email bucket alone throttles nothing when the attacker
        // varies the email, which is exactly the shape of password-reset
        // bombing and user enumeration. The IP ceiling is deliberately a few
        // multiples of the email budget so a genuinely shared egress still
        // has room, while a single host spraying addresses runs out.
        RateLimiter::for('auth', function (Request $request) {
            $limits = [Limit::perMinutes(10, 50)->by('auth-ip:'.$request->ip())];

            $email = strtolower((string) $request->input('email', ''));
            if ($email !== '') {
                $limits[] = Limit::perMinutes(10, 20)->by('auth-id:'.$email.'|'.$request->ip());
            }

            return $limits;
        });

        // Chat throttle — every LLM call costs money. Default 10/min per
        // user (or per IP for anonymous, though the chat routes are all
        // behind auth:sanctum so that fallback only matters if middleware
        // ordering changes). Configurable via AI_CHAT_RATE_LIMIT.
        RateLimiter::for('chat', function (Request $request) {
            return Limit::perMinute((int) config('ai.chat.rate_limit_per_minute', 10))
                ->by($request->user()?->id ?: $request->ip());
        });

        // Role gates — controllers/blade can call `Gate::allows('edit-internal')`
        // and stay decoupled from the underlying role tiers.
        Gate::define('edit-internal', fn (User $user) => $user->role()->canEditInternal());
        Gate::define('manage-users', fn (User $user) => $user->role()->canManageUsers());
        Gate::define('view-feed-status', fn (User $user) => $user->role()->isAtLeast(Role::Admin));
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
