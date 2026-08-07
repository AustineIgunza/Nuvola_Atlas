<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Internal transport guard for the FastAPI -> Laravel hop. The full
 * contract lives in `docs/data/internal-transport.md`.
 *
 * Three headers, all required:
 *   X-Internal-Secret    shared token, compared with hash_equals
 *   X-Internal-Timestamp unix seconds, bounds the replay window
 *   X-Internal-Signature sha256=<hex> HMAC over "{timestamp}.{raw body}"
 *
 * The token alone proves the caller knows the secret; the signature proves
 * the body was not rewritten in transit and expires the request once it
 * drifts outside MAX_CLOCK_SKEW. 401 (not 403) so callers treat it as an
 * auth failure — the RFC 7807 renderer in bootstrap/app.php shapes the body.
 */
class VerifyInternalSecret
{
    /**
     * Tolerated clock drift between the ingestion runtime and this host.
     * Mirrors MAX_CLOCK_SKEW_SECONDS in nuvola-atlas-ingestion/app/signing.py.
     */
    private const MAX_CLOCK_SKEW = 300;

    public function handle(Request $request, Closure $next): Response
    {
        $expected = (string) config('services.ingest.secret', '');

        if ($expected === '') {
            abort(503, 'Ingestion secret is not configured on this deployment.');
        }

        $provided = (string) $request->header('X-Internal-Secret', '');

        if (! hash_equals($expected, $provided)) {
            $this->deny($request, 'secret mismatch', $provided);
        }

        $timestamp = (string) $request->header('X-Internal-Timestamp', '');
        $signature = (string) $request->header('X-Internal-Signature', '');

        if ($timestamp === '' || $signature === '') {
            $this->deny($request, 'signature headers missing', $provided);
        }

        if (! ctype_digit($timestamp) || abs(time() - (int) $timestamp) > self::MAX_CLOCK_SKEW) {
            $this->deny($request, 'timestamp outside skew window', $provided);
        }

        $computed = 'sha256='.hash_hmac('sha256', $timestamp.'.'.$request->getContent(), $expected);

        if (! hash_equals($computed, $signature)) {
            $this->deny($request, 'signature mismatch', $provided);
        }

        return $next($request);
    }

    /**
     * Logs a redacted fingerprint — never the raw header value — then 401s.
     */
    private function deny(Request $request, string $reason, string $presented): never
    {
        Log::warning('Rejected internal request', [
            'reason' => $reason,
            'path' => $request->path(),
            'ip' => $request->ip(),
            'presented' => $presented === ''
                ? 'sha256:empty'
                : 'sha256:'.substr(hash('sha256', $presented), 0, 12),
        ]);

        abort(401, 'Invalid or missing internal transport credentials.');
    }
}
