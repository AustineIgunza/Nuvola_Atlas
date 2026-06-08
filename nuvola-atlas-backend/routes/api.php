<?php

declare(strict_types=1);

use App\Http\Controllers\AdminApiKeyController;
use App\Http\Controllers\AdminAuditController;
use App\Http\Controllers\AdminMetricsController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TwoFactorController;
use App\Http\Controllers\VitalityController;
use App\Http\Controllers\ZoneController;
use Illuminate\Support\Facades\Route;

// Unversioned operational endpoints
Route::get('health', [HealthController::class, 'index']);

// /api/v1/ — all current consumer endpoints. Reserve /api/v2/ for breaking
// changes; never delete a v1 endpoint without a 90-day deprecation header.
Route::prefix('v1')->middleware('throttle:api')->group(function () {
    Route::get('zones', [ZoneController::class, 'index']);
    Route::get('zones/{id}', [ZoneController::class, 'show']);
    Route::get('zones/{id}/activity', [ZoneController::class, 'activity']);
    Route::get('zones/{id}/layers', [ZoneController::class, 'layers']);

    Route::get('projects', [ProjectController::class, 'index']);
    Route::get('projects/{id}', [ProjectController::class, 'show']);

    Route::get('alerts', [AlertController::class, 'index']);
    Route::get('reports', [ReportController::class, 'index']);
    Route::get('history', [HistoryController::class, 'index']);
    Route::get('vitality/methodology', [VitalityController::class, 'methodology']);

    Route::middleware('throttle:auth')->group(function () {
        Route::post('auth/sign-in', [AuthController::class, 'signIn']);
        Route::post('auth/register', [AuthController::class, 'register']);
        Route::post('auth/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('auth/reset-password', [AuthController::class, 'resetPassword']);
        // Email-2FA sign-in challenge verification — not authed because the
        // user doesn't yet have a session at this stage.
        Route::post('auth/2fa/verify', [TwoFactorController::class, 'verify']);
    });

    Route::middleware(['auth:sanctum', 'partner.context'])->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/sign-out', [AuthController::class, 'signOut']);

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
        });
    });
});
