<?php

declare(strict_types=1);

namespace App\Services\Agents\Providers;

use App\Services\Agents\AgentProvider;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Talks to a HuggingFace Inference Endpoint. Model must support text
 * generation in the OpenAI-compatible /chat/completions format or plain
 * text-generation. Contract with the model:
 *
 *   - We render the user prompt + tool schemas + history into a single
 *     text prompt.
 *   - The model must reply with a JSON object matching one of:
 *       { "action": "tool_call", "tool": "<name>", "args": { ... } }
 *       { "action": "final", "answer": "..." }
 *
 * If the model returns anything else we fall back to the heuristic
 * provider so the assistant stays responsive.
 */
class HuggingFaceAgentProvider implements AgentProvider
{
    public function __construct(private HeuristicAgentProvider $fallback) {}

    public function nextStep(string $prompt, array $tools, array $history): array
    {
        $endpoint = (string) config('services.agents.huggingface.endpoint', '');
        $token = (string) config('services.agents.huggingface.token', '');
        $model = (string) config('services.agents.huggingface.model', '');
        $timeout = (int) config('services.agents.huggingface.timeout', 60);

        if ($endpoint === '' || $token === '') {
            Log::warning('HF endpoint not configured, falling back to heuristic');

            return $this->fallback->nextStep($prompt, $tools, $history);
        }

        try {
            $body = $this->buildOpenAIStyleBody($prompt, $tools, $history, $model);
            $response = Http::withToken($token)
                ->acceptJson()
                ->timeout($timeout)
                ->post($endpoint, $body);

            $decoded = $this->decode($response);
            $step = $this->coerce($decoded);
            if ($step === null) {
                Log::warning('HF model returned unusable response, falling back', ['raw' => $decoded]);

                return $this->fallback->nextStep($prompt, $tools, $history);
            }

            return $step;
        } catch (Throwable $e) {
            Log::warning('HF call failed, falling back to heuristic', ['error' => $e->getMessage()]);

            return $this->fallback->nextStep($prompt, $tools, $history);
        }
    }

    private function buildOpenAIStyleBody(string $prompt, array $tools, array $history, string $model): array
    {
        $system = 'You are the Navuuna assistant. You have access to tools that read Nairobi sub-county Vitality data. '
            ."For every turn you MUST reply with a JSON object matching either:\n"
            .'{"action":"tool_call","tool":"<name>","args":{...}}'."\n"
            .'{"action":"final","answer":"..."}'."\n"
            ."Available tools:\n".json_encode($tools, JSON_PRETTY_PRINT);

        $messages = [['role' => 'system', 'content' => $system]];
        foreach ($history as $turn) {
            $messages[] = ['role' => $turn['role'], 'content' => $turn['content']];
        }
        $messages[] = ['role' => 'user', 'content' => $prompt];

        $body = [
            'messages' => $messages,
            'max_tokens' => 512,
            'temperature' => 0,
        ];
        if ($model !== '') {
            $body['model'] = $model;
        }

        return $body;
    }

    private function decode(Response $response): mixed
    {
        if (! $response->ok()) {
            throw new RuntimeException("HF endpoint returned {$response->status()}");
        }

        return $response->json();
    }

    /**
     * @return array{action: 'tool_call'|'final', tool?: string, args?: array<string,mixed>, answer?: string, reasoning?: string}|null
     */
    private function coerce(mixed $raw): ?array
    {
        // OpenAI-style: { choices: [ { message: { content: "<json>" } } ] }
        $content = null;
        if (is_array($raw)) {
            $content = $raw['choices'][0]['message']['content']
                ?? $raw['generated_text']
                ?? $raw[0]['generated_text']
                ?? null;
        }
        if (! is_string($content)) {
            return null;
        }

        $decoded = json_decode(trim($content), true);
        if (! is_array($decoded)) {
            return null;
        }

        if (($decoded['action'] ?? '') === 'final' && is_string($decoded['answer'] ?? null)) {
            return ['action' => 'final', 'answer' => $decoded['answer']];
        }
        if (($decoded['action'] ?? '') === 'tool_call' && is_string($decoded['tool'] ?? null)) {
            return [
                'action' => 'tool_call',
                'tool' => $decoded['tool'],
                'args' => is_array($decoded['args'] ?? null) ? $decoded['args'] : [],
            ];
        }

        return null;
    }
}
