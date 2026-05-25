<?php

declare(strict_types=1);

use App\Http\Controllers\AlertController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\VitalityController;
use App\Http\Controllers\ZoneController;
use Illuminate\Support\Facades\Route;

// Public endpoints
Route::middleware('throttle:api')->group(function () {
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

    // Auth (rate-limited to 5/min)
    Route::middleware('throttle:auth')->group(function () {
        Route::post('auth/sign-in', [AuthController::class, 'signIn']);
        Route::post('auth/register', [AuthController::class, 'register']);
        Route::post('auth/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('auth/reset-password', [AuthController::class, 'resetPassword']);
    });

    // Authenticated endpoints
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/sign-out', [AuthController::class, 'signOut']);
        Route::post('alerts/mark-all-read', [AlertController::class, 'markAllRead']);
        Route::post('reports', [ReportController::class, 'store']);
    });
});
