<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * X-Internal-Secret contract between FastAPI ingestion service and the
 * Laravel /ingest endpoint. Compares against `config('services.ingest.secret')`
 * (env: `INGEST_INTERNAL_SECRET`).
 *
 * Uses hash_equals so a short-circuit compare cannot leak length via
 * timing. Returns 401 (not 403) so clients treat it as an auth failure
 * — the RFC 7807 renderer in bootstrap/app.php shapes the body.
 */
class VerifyInternalSecret
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = (string) config('services.ingest.secret', '');
        $provided = (string) $request->header('X-Internal-Secret', '');

        if ($expected === '' || ! hash_equals($expected, $provided)) {
            abort(401, 'Invalid or missing X-Internal-Secret.');
        }

        return $next($request);
    }
}
