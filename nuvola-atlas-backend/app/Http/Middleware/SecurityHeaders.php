<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');
        $response->headers->set('Cross-Origin-Resource-Policy', 'same-site');

        // CSP for HTML (Inertia) responses only — JSON API responses don't
        // need a script policy, and applying one to JSON breaks nothing but
        // adds payload weight.
        $contentType = (string) $response->headers->get('Content-Type', '');
        if (str_starts_with($contentType, 'text/html')) {
            $response->headers->set('Content-Security-Policy', $this->csp());
        }

        if (app()->environment('production')) {
            // preload-eligible HSTS — submit at https://hstspreload.org once
            // the production hostname is final.
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload'
            );
        }

        return $response;
    }

    private function csp(): string
    {
        // Allowlist is intentionally narrow: same-origin + Mapbox (tiles +
        // worker bundle). No inline scripts, no eval. Expand only with a
        // documented security justification.
        return implode('; ', [
            "default-src 'self'",
            "script-src 'self' https://api.mapbox.com",
            "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
            "img-src 'self' data: blob: https://*.tiles.mapbox.com https://api.mapbox.com",
            "font-src 'self' data:",
            "connect-src 'self' https://api.mapbox.com https://events.mapbox.com",
            "worker-src 'self' blob:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
        ]);
    }
}
