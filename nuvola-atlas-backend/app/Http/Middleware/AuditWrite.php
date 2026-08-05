<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\Audit;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Terminate middleware — writes an `audit_logs` row for every non-GET
 * request that lands on a route guarded by this middleware.
 *
 * Action name is derived from `route()->getName()` when a route name is
 * set (e.g. `admin.firms.store`); otherwise falls back to the HTTP verb
 * + path pattern. This is a belt-and-braces addition to model
 * observers — controllers that hand-crank an audit line don't need this,
 * but a controller that forgets still gets a base-level record.
 */
class AuditWrite
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        if ($request->method() === 'GET' || $request->method() === 'HEAD') {
            return;
        }
        if ($response->getStatusCode() >= 400) {
            return;
        }

        $action = $request->route()?->getName()
            ?: strtolower($request->method()).'.'.trim((string) $request->route()?->uri(), '/');

        Audit::record(action: 'route.'.$action);
    }
}
