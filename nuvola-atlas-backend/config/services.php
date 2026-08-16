<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Shared secret between the FastAPI ingestion service and the Laravel
    // /ingest endpoint. Set INGEST_INTERNAL_SECRET on both services to the
    // same value — VerifyInternalSecret middleware guards the endpoint.
    'ingest' => [
        'secret' => env('INGEST_INTERNAL_SECRET'),
    ],

    // Google OAuth. `redirect` defaults to a URL derived from APP_URL if
    // no explicit override; expose it here so the callback controller
    // and the frontend "Continue with Google" button use the same value.
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI', env('APP_URL').'/api/v1/auth/google/callback'),
    ],

    // Assistant agent runtime — pluggable LLM provider. `heuristic` is
    // the default no-key fallback that ships tool routing without an
    // external model. Flip AGENT_PROVIDER=huggingface once the HF
    // Inference Endpoint is live.
    'agents' => [
        'provider' => env('AGENT_PROVIDER', 'heuristic'),
        'huggingface' => [
            'endpoint' => env('HF_ENDPOINT'),
            'token' => env('HF_TOKEN'),
            'model' => env('HF_MODEL'),
            'timeout' => (int) env('HF_TIMEOUT', 60),
        ],
    ],

];
