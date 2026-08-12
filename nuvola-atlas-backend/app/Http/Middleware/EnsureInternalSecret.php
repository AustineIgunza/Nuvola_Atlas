<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Illuminate\Support\Facades\Log;

class EnsureInternalSecret
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('X-Internal-Secret');

        if (empty($header)) {
            throw new UnauthorizedHttpException('X-Internal-Secret', 'X-Internal-Secret header is missing.');
        }

        $secret = config('ingestion.internal_secret');

        if (empty($secret)) {
            Log::error('Ingestion secret not configured on backend.');
            throw new UnauthorizedHttpException('X-Internal-Secret', 'Server configuration error: Ingestion secret is not configured.');
        }

        // Enforce the 48+ bytes length requirement from the internal transport contract
        if (strlen($header) < 48) {
            $fingerprint = hash('sha256', $header);
            Log::warning("X-Internal-Secret header present but too short. Fingerprint: sha256:{$fingerprint}");
            throw new UnauthorizedHttpException('X-Internal-Secret', 'invalid X-Internal-Secret header (too short)');
        }

        // Support both direct secret match and HMAC signature of request body
        $body = $request->getContent();
        $expectedSignature = hash_hmac('sha256', $body, $secret);

        $isValidSecret = hash_equals($secret, $header);
        $isValidSignature = hash_equals($expectedSignature, $header);

        if (! $isValidSecret && ! $isValidSignature) {
            $fingerprint = hash('sha256', $header);
            Log::warning("X-Internal-Secret mismatch. Fingerprint: sha256:{$fingerprint}");
            throw new UnauthorizedHttpException('X-Internal-Secret', 'invalid X-Internal-Secret header');
        }

        return $next($request);
    }
}
