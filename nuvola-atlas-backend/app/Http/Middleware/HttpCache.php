<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * HTTP cache headers (§9.9): ETag + Cache-Control on read-only GETs.
 *
 * Why both:
 * - ETag lets a client (TanStack Query, mobile app, partner integration)
 *   re-validate without paying for the JSON payload — we return 304 with
 *   an empty body when the hash matches.
 * - Cache-Control: private, max-age=N lets the same client cache the
 *   response without round-tripping at all for N seconds.
 *
 * Only fires on GET responses. POST/PATCH/DELETE pass through unchanged
 * — caching writes would be dangerous and "Cache-Control" on a mutation
 * confuses intermediaries.
 *
 * Usage in routes/api.php:
 *
 *     Route::get('zones', ...)->middleware('http.cache:300');
 *     Route::get('projects', ...)->middleware('http.cache:300,public');
 *
 * `max-age` is in seconds. `visibility` defaults to `private` so shared
 * caches (Cloudflare, browser shared storage) don't fan the response out
 * to other users. Pass `public` only for genuinely public, anonymous-
 * readable endpoints.
 */
class HttpCache
{
    public function handle(Request $request, Closure $next, string $maxAge = '300', string $visibility = 'private'): Response
    {
        /** @var Response $response */
        $response = $next($request);

        if (! $request->isMethodCacheable()) {
            return $response;
        }

        $status = $response->getStatusCode();
        if ($status < 200 || $status >= 300) {
            return $response;
        }

        $body = (string) $response->getContent();
        $etag = '"'.md5($body).'"';

        $cacheControl = sprintf('%s, max-age=%d', $visibility, (int) $maxAge);

        $response->headers->set('ETag', $etag);
        $response->headers->set('Cache-Control', $cacheControl);

        $ifNoneMatch = $request->headers->get('If-None-Match');
        if ($ifNoneMatch !== null && $this->etagMatches($ifNoneMatch, $etag)) {
            // RFC 7232 §4.1: 304 Not Modified with the relevant cache
            // headers and no body. Send the ETag back so the client knows
            // the version it just confirmed.
            return response('', 304, [
                'ETag' => $etag,
                'Cache-Control' => $cacheControl,
            ]);
        }

        return $response;
    }

    /**
     * If-None-Match is a comma-separated list ("etag1", "etag2", "*").
     * The wildcard always matches. Otherwise compare strong tags.
     */
    private function etagMatches(string $ifNoneMatch, string $etag): bool
    {
        $candidates = array_map('trim', explode(',', $ifNoneMatch));
        foreach ($candidates as $candidate) {
            if ($candidate === '*' || $candidate === $etag) {
                return true;
            }
        }

        return false;
    }
}
