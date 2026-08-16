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

    /*
    |--------------------------------------------------------------------------
    | Stall Threshold
    |--------------------------------------------------------------------------
    |
    | How long /api/health/ingestion tolerates silence from the FastAPI
    | cleaner before it reports "stalled" and answers 503. Daystar's
    | contracted cadence is daily, so 24h of nothing means the channel is
    | broken rather than merely quiet.
    |
    */
    'stall_after_minutes' => (int) env('INGESTION_STALL_AFTER_MINUTES', 1440),

    /*
    |--------------------------------------------------------------------------
    | Payload Retention
    |--------------------------------------------------------------------------
    |
    | Days a raw batch payload is kept before nuvola:prune-ingestion-payloads
    | redacts it. The analytical outcome of the batch is retained forever;
    | only the verbatim payload is dropped, for KDPA data minimisation.
    |
    */
    'payload_retention_days' => (int) env('INGESTION_PAYLOAD_RETENTION_DAYS', 30),
];
