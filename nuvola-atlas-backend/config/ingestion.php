<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Ingestion Inbound Credentials
    |--------------------------------------------------------------------------
    |
    | This key acts as the server-to-server secret token shared between the
    | FastAPI ingestion service and the Laravel intake API. It must be at
    | least 48 characters long and base64-safe.
    |
    */
    'internal_secret' => env('INGESTION_INTERNAL_SECRET'),
];
