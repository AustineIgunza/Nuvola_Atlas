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

    Route::post('auth/sign-in', [AuthController::class, 'signIn']);

    // TODO: Gate behind auth:sanctum once frontend sends Bearer token
    Route::post('alerts/mark-all-read', [AlertController::class, 'markAllRead']);
    Route::post('reports', [ReportController::class, 'store']);
});
