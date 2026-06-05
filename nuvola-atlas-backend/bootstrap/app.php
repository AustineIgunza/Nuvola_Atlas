<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

// Defined above the return so it is in scope by the time the exception
// renderer closure below fires. Anything after Application::create() never
// executes — the file returns immediately.
if (! function_exists('problemResponse')) {
    function problemResponse(\Throwable $e, Request $request): JsonResponse
    {
        $base = rtrim(config('app.url', ''), '/').'/problems';

        if ($e instanceof ValidationException) {
            return new JsonResponse([
                'type' => $base.'/validation-error',
                'title' => 'Validation failed',
                'status' => 422,
                'detail' => $e->getMessage(),
                'instance' => $request->path(),
                'errors' => $e->errors(),
            ], 422, ['Content-Type' => 'application/problem+json']);
        }

        if ($e instanceof AuthenticationException) {
            return new JsonResponse([
                'type' => $base.'/unauthenticated',
                'title' => 'Unauthenticated',
                'status' => 401,
                'detail' => 'A valid bearer token is required to access this resource.',
                'instance' => $request->path(),
            ], 401, ['Content-Type' => 'application/problem+json']);
        }

        if (
            $e instanceof NotFoundHttpException
            || $e instanceof ModelNotFoundException
            || $e->getPrevious() instanceof ModelNotFoundException
        ) {
            return new JsonResponse([
                'type' => $base.'/not-found',
                'title' => 'Resource not found',
                'status' => 404,
                'detail' => 'The requested resource does not exist.',
                'instance' => $request->path(),
            ], 404, ['Content-Type' => 'application/problem+json']);
        }

        if ($e instanceof HttpExceptionInterface) {
            $status = $e->getStatusCode();

            return new JsonResponse([
                'type' => $base.'/http-error',
                'title' => 'Request failed',
                'status' => $status,
                'detail' => $e->getMessage() !== '' ? $e->getMessage() : 'HTTP '.$status,
                'instance' => $request->path(),
            ], $status, ['Content-Type' => 'application/problem+json']);
        }

        $debug = config('app.debug', false);

        return new JsonResponse([
            'type' => $base.'/internal-error',
            'title' => 'Internal server error',
            'status' => 500,
            'detail' => $debug ? $e->getMessage() : 'An unexpected error occurred.',
            'instance' => $request->path(),
        ], 500, ['Content-Type' => 'application/problem+json']);
    }
}

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\SecurityHeaders::class,
        ]);
        // Token-based auth (Bearer) — no stateful/CSRF needed
        // $middleware->api(prepend: [
        //     \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        // ]);
        $middleware->api(append: [
            \App\Http\Middleware\SecurityHeaders::class,
        ]);
        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureRole::class,
            'partner.context' => \App\Http\Middleware\SetPartnerContext::class,
            'admin.two_factor' => \App\Http\Middleware\RequireAdminTwoFactor::class,
        ]);
        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('api/*') ? null : route('login'));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(function (Request $request, \Throwable $e) {
            return $request->is('api/*') || $request->expectsJson();
        });

        // RFC 7807 application/problem+json for every API failure. Keeps the
        // wire shape stable for partners and matches what the OpenAPI spec
        // declares as the error response type.
        $exceptions->render(function (\Throwable $e, Request $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return null;
            }

            return problemResponse($e, $request);
        });

        // Forward unhandled exceptions to Sentry when configured. The package
        // only binds the `sentry` container key after sentry-laravel boots
        // with a non-empty DSN — so this is a true no-op in local dev, CI,
        // and any environment without SENTRY_LARAVEL_DSN set.
        $exceptions->reportable(function (\Throwable $e): void {
            if (app()->bound('sentry')) {
                app('sentry')->captureException($e);
            }
        });
    })->create();
