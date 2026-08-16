<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Exact origins from env (comma-separated). Empty entries dropped so a
    // trailing comma or blank env doesn't silently allow the empty string.
    'allowed_origins' => array_values(array_filter(
        array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173'))),
        fn (string $o) => $o !== ''
    )),

    // Preview / branch deploys on Vercel get URLs like
    // `https://navuuna-git-<branch>-<team>.vercel.app`. Allow any Vercel
    // subdomain by default so preview links keep working without editing
    // env every time. Override with CORS_ALLOWED_ORIGIN_PATTERNS to lock
    // this down before production.
    'allowed_origins_patterns' => array_values(array_filter(
        array_map(
            'trim',
            explode(',', env('CORS_ALLOWED_ORIGIN_PATTERNS', '#^https://[a-z0-9-]+\.vercel\.app$#'))
        ),
        fn (string $p) => $p !== ''
    )),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
