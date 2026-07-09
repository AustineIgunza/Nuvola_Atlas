<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | AI Gateway
    |--------------------------------------------------------------------------
    |
    | Vercel AI Gateway is the OpenAI-compatible endpoint we call to run
    | chat completions. The model string uses the "provider/model" form so
    | swapping models never touches code. If the API key is empty the chat
    | endpoints return 503 with a plain "AI is not configured" body.
    |
    */
    'gateway' => [
        'url' => env('AI_GATEWAY_URL', 'https://ai-gateway.vercel.sh/v1'),
        'api_key' => env('AI_GATEWAY_API_KEY'),
        'model' => env('AI_MODEL', 'anthropic/claude-sonnet-4-6'),
        'timeout' => (int) env('AI_GATEWAY_TIMEOUT', 45),
    ],

    /*
    |--------------------------------------------------------------------------
    | Chat behaviour
    |--------------------------------------------------------------------------
    */
    'chat' => [
        'rate_limit_per_minute' => (int) env('AI_CHAT_RATE_LIMIT', 10),
        'max_context_messages' => (int) env('AI_CHAT_CONTEXT', 6),
        'max_result_rows' => 200,
        'hard_limit' => 1000,
    ],

    /*
    |--------------------------------------------------------------------------
    | Table allowlist
    |--------------------------------------------------------------------------
    |
    | The SqlGuard rejects any query that references a table outside this
    | list. The read-only DB role also only receives SELECT on these tables.
    | Keep this list narrow — anything readable here is readable by the LLM.
    |
    */
    'allowed_tables' => [
        'zones',
        'zone_score_snapshots',
        'zone_layers',
        'projects',
        'alerts',
        'reports',
        'activities',
        'vitality_history',
        'users',
    ],
];
