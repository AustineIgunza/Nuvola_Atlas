<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

/**
 * Route::middleware('role:editor,admin')->...
 * Route::middleware('role:partner')->...   — any one of the listed roles allows.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        if ($user === null) {
            throw new UnauthorizedHttpException('Bearer', 'Authentication required.');
        }

        $allowed = array_map(fn (string $r) => Role::from($r), $roles);
        if (! in_array($user->role(), $allowed, true)) {
            throw new AccessDeniedHttpException('Insufficient role.');
        }

        return $next($request);
    }
}
