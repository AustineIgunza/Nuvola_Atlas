<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks admin users from reaching admin routes until they have enrolled
 * in 2FA. Returns a structured 403 the frontend can intercept to send the
 * admin to the enrolment wizard.
 *
 * Wired into /api/v1/admin/* in routes/api.php.
 */
class RequireAdminTwoFactor
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user === null || $user->role() !== Role::Admin) {
            return $next($request);
        }

        if (! $user->hasTwoFactorEnabled()) {
            return new JsonResponse([
                'type' => rtrim(config('app.url', ''), '/').'/problems/two-factor-required',
                'title' => 'Two-factor authentication required',
                'status' => 403,
                'detail' => 'Admin accounts must enrol in TOTP before reaching admin routes. POST /api/v1/auth/2fa/enable to start.',
                'instance' => $request->path(),
                'two_factor_required' => true,
            ], 403, ['Content-Type' => 'application/problem+json']);
        }

        return $next($request);
    }
}
