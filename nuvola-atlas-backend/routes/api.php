<?php

declare(strict_types=1);

use App\Http\Controllers\AdminApiKeyController;
use App\Http\Controllers\AdminAuditController;
use App\Http\Controllers\AdminContentController;
use App\Http\Controllers\AdminFeedsController;
use App\Http\Controllers\AdminFirmController;
use App\Http\Controllers\AdminImpersonateController;
use App\Http\Controllers\AdminMethodologyController;
use App\Http\Controllers\AdminMetricsController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\AssistantAgentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\IngestController;
use App\Http\Controllers\InvestorBriefController;
use App\Http\Controllers\InvestorController;
use App\Http\Controllers\InvestorOpportunitiesController;
use App\Http\Controllers\InvestorPortfolioController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TwoFactorController;
use App\Http\Controllers\VerifyEmailController;
use App\Http\Controllers\VitalityController;
use App\Http\Controllers\ZoneController;
use App\Http\Controllers\ZoneExportController;
use App\Http\Controllers\ZoneForecastController;
use App\Http\Controllers\ZoneHistoryController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

// Unversioned operational endpoints
Route::get('health', [HealthController::class, 'index']);
// "intake", not "ingestion": the FastAPI service already owns
// /api/health/ingestion on its own host, and two identically-named health
// endpoints meaning different things is a trap at 2am.
Route::get('health/intake', [HealthController::class, 'intake']);

// Phase B — FastAPI → Laravel ingestion channel. Guarded by
// X-Internal-Secret only; never accepts a bearer token.
Route::middleware('internal.secret')->post('v1/ingest', [IngestController::class, 'store']);

// Google OAuth — public endpoints (redirect is JSON-returning so the SPA
// can window.location.assign() to the Google consent URL; callback runs
// stateless and mints a Sanctum token before bouncing to the SPA).
Route::prefix('v1')->group(function () {
    Route::get('auth/google/redirect', [GoogleAuthController::class, 'redirect'])
        ->middleware('throttle:auth');
    Route::get('auth/google/callback', [GoogleAuthController::class, 'callback'])
        ->middleware('throttle:auth');
});

// /api/v1/ — all current consumer endpoints. Reserve /api/v2/ for breaking
// changes; never delete a v1 endpoint without a 90-day deprecation header.
Route::prefix('v1')->middleware('throttle:api')->group(function () {
    // Read-only zone + project endpoints are slow-moving — apply the
    // HTTP cache layer (ETag + Cache-Control: private, max-age=300) so
    // partner integrations and TanStack Query don't re-pay payload cost
    // for re-renders within a 5-minute window. /activity is realtime so
    // it stays no-cache.
    Route::middleware('http.cache:300')->group(function () {
        Route::get('zones', [ZoneController::class, 'index']);
        Route::get('zones/{id}', [ZoneController::class, 'show']);
        Route::get('zones/{id}/layers', [ZoneController::class, 'layers']);
        Route::get('zones/{id}/history', [ZoneHistoryController::class, 'show']);
        Route::get('zones/{id}/forecast', [ZoneForecastController::class, 'show']);
        Route::get('zones/{id}/export', [ZoneExportController::class, 'show']);

        Route::get('projects', [ProjectController::class, 'index']);
        Route::get('projects/{id}', [ProjectController::class, 'show']);
    });

    Route::get('zones/{id}/activity', [ZoneController::class, 'activity']);

    Route::get('alerts', [AlertController::class, 'index']);
    Route::get('reports', [ReportController::class, 'index']);
    Route::get('history', [HistoryController::class, 'index']);
    Route::get('vitality/methodology', [VitalityController::class, 'methodology']);
    Route::get('vitality/county', [VitalityController::class, 'county']);

    Route::middleware('throttle:auth')->group(function () {
        Route::post('auth/sign-in', [AuthController::class, 'signIn']);
        Route::post('auth/register', [AuthController::class, 'register']);
        Route::post('auth/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('auth/reset-password', [AuthController::class, 'resetPassword']);

        // Email verification landing. The name "verification.verify" is what
        // Laravel's SendEmailVerificationNotification requires when it builds
        // the signed URL — without this route existing the notification
        // throws "Route [verification.verify] not defined".
        Route::get('auth/email/verify/{id}/{hash}', VerifyEmailController::class)
            ->middleware('signed')
            ->name('verification.verify');
        // Email-2FA sign-in challenge verification — not authed because the
        // user doesn't yet have a session at this stage.
        Route::post('auth/2fa/verify', [TwoFactorController::class, 'verify']);
    });

    Route::middleware(['auth:sanctum', 'partner.context'])->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/sign-out', [AuthController::class, 'signOut']);

        // Private-channel authorization for Reverb. The framework's default
        // /broadcasting/auth sits on the `web` guard, which a bearer-token SPA
        // can never satisfy — so the SPA authorizes here instead, against the
        // same Sanctum guard it uses for every other call. Callbacks still
        // come from routes/channels.php.
        Broadcast::routes(['middleware' => ['auth:sanctum']]);

        // RAG chatbot — throttled per user via the 'chat' limiter (see
        // AppServiceProvider). Streaming send endpoint uses SSE and cannot
        // be HTTP-cached (that's why chat routes live outside the
        // http.cache:300 block above).
        Route::get('chat/conversations', [ChatController::class, 'index'])->middleware('throttle:api');
        Route::post('chat/conversations', [ChatController::class, 'store'])->middleware('throttle:api');
        Route::delete('chat/conversations/{id}', [ChatController::class, 'destroy'])->middleware('throttle:api');
        Route::get('chat/conversations/{id}/messages', [ChatController::class, 'messages'])->middleware('throttle:api');
        Route::post('chat/conversations/{id}/messages', [ChatController::class, 'send'])->middleware('throttle:chat');

        // Assistant agent — provider-agnostic tool-calling loop. Heuristic
        // provider ships by default; flip AGENT_PROVIDER=huggingface once
        // the HF Inference Endpoint is live to swap in the LLM router.
        Route::get('assistant/agent/tools', [AssistantAgentController::class, 'tools'])->middleware('throttle:api');
        Route::post('assistant/agent', [AssistantAgentController::class, 'run'])->middleware('throttle:chat');

        // Email-2FA self-service: any authenticated user can enrol; admins
        // are *required* to enrol before they can reach /admin/* (see
        // admin.two_factor below).
        Route::post('auth/2fa/email/start', [TwoFactorController::class, 'emailStart']);
        Route::post('auth/2fa/email/confirm', [TwoFactorController::class, 'emailConfirm']);
        Route::post('auth/2fa/email/disable', [TwoFactorController::class, 'emailDisable']);

        // Internal writes require editor or admin role; viewers and partners
        // can read everything but not flip alerts or publish reports.
        Route::middleware('role:editor,admin')->group(function () {
            Route::post('alerts/mark-all-read', [AlertController::class, 'markAllRead']);
            Route::post('reports', [ReportController::class, 'store']);
        });

        // Phase F — investor suite. Behind `firm.scope` middleware so
        // unaffiliated users get a 403. Cross-firm leakage prevention
        // lives inside every controller method: no query runs without a
        // `firm_id = <caller's firm>` clause.
        Route::middleware(['firm.scope'])->prefix('investor')->group(function () {
            Route::get('me', [InvestorController::class, 'me']);

            Route::get('watchlist', [InvestorController::class, 'watchlist']);
            Route::post('watchlist', [InvestorController::class, 'addToWatchlist']);
            Route::patch('watchlist/{id}', [InvestorController::class, 'updateWatchlistEntry']);
            Route::delete('watchlist/{id}', [InvestorController::class, 'removeFromWatchlist']);

            Route::get('portfolio', [InvestorPortfolioController::class, 'show']);
            Route::get('opportunities', [InvestorOpportunitiesController::class, 'index']);
            Route::get('brief', [InvestorBriefController::class, 'download']);
        });

        // Admin-only: dashboard metrics, audit feed, user management, and
        // long-lived partner API keys. Anything under /admin/ requires
        // role=admin AND 2FA enrolled. Never accepts a partner-scoped key.
        Route::middleware(['role:admin', 'admin.two_factor'])->prefix('admin')->group(function () {
            Route::get('metrics', [AdminMetricsController::class, 'index']);
            Route::get('metrics/audit-volume', [AdminMetricsController::class, 'auditVolume']);

            Route::get('audit', [AdminAuditController::class, 'index']);
            Route::get('audit/export', [AdminAuditController::class, 'export']);

            Route::get('users', [AdminUserController::class, 'index']);
            Route::patch('users/{id}', [AdminUserController::class, 'update']);

            Route::get('api-keys', [AdminApiKeyController::class, 'index']);
            Route::post('api-keys', [AdminApiKeyController::class, 'store']);
            Route::delete('api-keys/{id}', [AdminApiKeyController::class, 'destroy']);

            // Phase E — firms, methodology, feeds, impersonation, content CMS.
            Route::get('firms', [AdminFirmController::class, 'index']);
            Route::get('firms/{id}', [AdminFirmController::class, 'show']);
            Route::post('firms', [AdminFirmController::class, 'store']);
            Route::patch('firms/{id}', [AdminFirmController::class, 'update']);
            Route::delete('firms/{id}', [AdminFirmController::class, 'destroy']);

            Route::get('methodology', [AdminMethodologyController::class, 'index']);
            Route::post('methodology/{id}/publish', [AdminMethodologyController::class, 'publish']);
            Route::post('methodology/preview', [AdminMethodologyController::class, 'preview']);

            Route::get('feeds', [AdminFeedsController::class, 'index']);

            Route::get('impersonate', [AdminImpersonateController::class, 'index']);
            Route::post('impersonate', [AdminImpersonateController::class, 'start']);
            Route::delete('impersonate/{id}', [AdminImpersonateController::class, 'stop']);

            Route::get('content', [AdminContentController::class, 'index']);
            Route::get('content/{key}', [AdminContentController::class, 'show']);
            Route::put('content/{key}', [AdminContentController::class, 'save']);
        });
    });
});
