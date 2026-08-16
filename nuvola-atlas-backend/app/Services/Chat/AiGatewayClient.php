<?php

declare(strict_types=1);

namespace App\Services\Chat;

use Generator;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AiGatewayClient
{
    /**
     * Send an OpenAI-compatible chat completion request to the AI Gateway.
     *
     * @param  array<int, array{role: string, content: string}>  $messages
     * @param  array<string, mixed>  $opts  Any extra shape (response_format, tools, temperature).
     * @return array{content: string, tokens_in: int|null, tokens_out: int|null}
     */
    public function complete(array $messages, array $opts = []): array
    {
        $this->assertConfigured();

        $payload = array_merge([
            'model' => config('ai.gateway.model'),
            'messages' => $messages,
            'stream' => false,
        ], $opts);

        $response = $this->http()->post('/chat/completions', $payload);

        if (! $response->ok()) {
            throw new RuntimeException(
                'AI Gateway request failed: '.$response->status().' '.$response->body()
            );
        }

        $json = $response->json();

        return [
            'content' => (string) ($json['choices'][0]['message']['content'] ?? ''),
            'tokens_in' => $json['usage']['prompt_tokens'] ?? null,
            'tokens_out' => $json['usage']['completion_tokens'] ?? null,
        ];
    }

    /**
     * Streaming chat completion. Yields delta strings as they arrive.
     *
     * @param  array<int, array{role: string, content: string}>  $messages
     * @return Generator<int, string>
     */
    public function stream(array $messages, array $opts = []): Generator
    {
        $this->assertConfigured();

        $payload = array_merge([
            'model' => config('ai.gateway.model'),
            'messages' => $messages,
            'stream' => true,
        ], $opts);

        $response = $this->http()->withOptions(['stream' => true])->post('/chat/completions', $payload);

        if (! $response->ok()) {
            throw new RuntimeException(
                'AI Gateway stream failed: '.$response->status().' '.$response->body()
            );
        }

        $body = $response->toPsrResponse()->getBody();
        $buffer = '';

        while (! $body->eof()) {
            $chunk = $body->read(4096);
            if ($chunk === '') {
                continue;
            }
            $buffer .= $chunk;

            // Server-sent-event frames: `data: {...}\n\n` (blank-line delimited).
            while (($pos = strpos($buffer, "\n\n")) !== false) {
                $frame = substr($buffer, 0, $pos);
                $buffer = substr($buffer, $pos + 2);

                foreach (explode("\n", $frame) as $line) {
                    if (! str_starts_with($line, 'data: ')) {
                        continue;
                    }
                    $data = substr($line, 6);
                    if ($data === '[DONE]') {
                        return;
                    }
                    $decoded = json_decode($data, true);
                    $delta = $decoded['choices'][0]['delta']['content'] ?? '';
                    if ($delta !== '') {
                        yield $delta;
                    }
                }
            }
        }
    }

    public function isConfigured(): bool
    {
        $key = config('ai.gateway.api_key');

        return is_string($key) && $key !== '';
    }

    private function assertConfigured(): void
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('AI Gateway is not configured — set AI_GATEWAY_API_KEY.');
        }
    }

    private function http()
    {
        return Http::baseUrl(rtrim((string) config('ai.gateway.url'), '/'))
            ->withToken((string) config('ai.gateway.api_key'))
            ->acceptJson()
            ->timeout((int) config('ai.gateway.timeout'));
    }
}
