<?php

declare(strict_types=1);

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Navuuna's backend is headless — the SPA lives in nuvola-atlas-frontend and
| deploys separately. There are no server-rendered pages. This file still
| exists because signed URLs (email verification, password reset) resolve
| through the web stack.
|
*/

Route::get('/', fn (): JsonResponse => response()->json([
    'service' => 'navuuna-api',
    'health' => rtrim((string) config('app.url'), '/').'/api/health',
]));
