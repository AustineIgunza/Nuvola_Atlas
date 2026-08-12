<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class VerifyInternalSecret
{
    /**
     * Tolerated clock drift between the ingestion runtime and this host.
     * Mirrors MAX_CLOCK_SKEW_SECONDS in nuvola-atlas-ingestion/app/signing.py.
     */
    private const MAX_CLOCK_SKEW = 300;

    public function handle(Request $request, Closure $next): Response
    {
        $expected = (string) (config('services.ingest.secret') ?: config('ingestion.internal_secret', ''));

        if ($expected === '') {
            abort(503, 'Ingestion secret is not configured on this deployment.');
        }

        $provided = (string) $request->header('X-Internal-Secret', '');

        if ($provided === '') {
            $this->deny($request, 'missing secret', $provided);
        }

        if (strlen($provided) < 48) {
            $this->deny($request, 'secret too short', $provided);
        }

        $timestamp = (string) $request->header('X-Internal-Timestamp', '');
        $signature = (string) $request->header('X-Internal-Signature', '');

        // If batch_id format without timestamp/signature (direct ingestion), check secret or HMAC
        if ($timestamp === '' && $signature === '' && $request->has('batch_id')) {
            $body = $request->getContent();
            $expectedSignature = hash_hmac('sha256', $body, $expected);

            $isValidSecret = hash_equals($expected, $provided);
            $isValidSignature = hash_equals($expectedSignature, $provided);

            if (! $isValidSecret && ! $isValidSignature) {
                $this->deny($request, 'secret or signature mismatch', $provided);
            }

            return $next($request);
        }

        if (! hash_equals($expected, $provided)) {
            $this->deny($request, 'secret mismatch', $provided);
        }

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
