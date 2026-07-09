<?php

declare(strict_types=1);

namespace App\Services\Chat;

/**
 * Small value object for the SSE stream. Encapsulates the event name +
 * JSON-serialisable payload so the controller doesn't have to know how
 * to format either.
 */
final class StreamEvent
{
    public function __construct(
        public readonly string $name,
        public readonly array $payload,
    ) {}

    public function toSse(): string
    {
        return 'event: ' . $this->name . "\n"
            . 'data: ' . json_encode($this->payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n\n";
    }
}
