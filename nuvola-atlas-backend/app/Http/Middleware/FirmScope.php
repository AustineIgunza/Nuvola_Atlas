<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates /investor/* routes on the caller having a primary_firm_id set.
 *
 * Admins bypass this check — they can look at any firm's data for
 * support/incident work; every read/write still lands in `audit_logs`
 * via the AuditableObserver.
 *
 * Rejects with RFC 7807 (rendered by bootstrap/app.php) — the shape
 * lines up with every other 4xx on the API.
 */
class FirmScope
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Sign-in required.');
        }

        $isAdmin = $user->role()?->value === 'admin';
        if (! $isAdmin && $user->primary_firm_id === null) {
            abort(403, 'This route requires an assigned firm.');
        }

        return $next($request);
    }
}
