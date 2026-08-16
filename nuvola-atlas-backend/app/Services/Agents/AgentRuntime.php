<?php

declare(strict_types=1);

namespace App\Services\Agents;

use App\Models\User;
use App\Support\Audit;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Runs the agent loop:
 *   1. Ask the provider what to do next given prompt + history.
 *   2. If tool_call → execute tool → append observation → repeat.
 *   3. If final → return the answer.
 *   4. Hard cap at MAX_STEPS to prevent runaway loops.
 */
class AgentRuntime
{
    public const MAX_STEPS = 4;

    public function __construct(
        private ToolRegistry $tools,
        private AgentProvider $provider,
    ) {}

    /**
     * @return array{
     *   answer: string,
     *   steps: list<array{action: string, tool?: string, args?: array<string,mixed>, observation?: array<string,mixed>, error?: string}>,
     *   final: bool
     * }
     */
    public function run(string $prompt, ?User $user = null): array
    {
        $userId = $user?->id;
        $tools = $this->tools->forUser($user);
        $history = [];
        $steps = [];

        for ($i = 0; $i < self::MAX_STEPS; $i++) {
            $next = $this->provider->nextStep($prompt, $tools->schemas(), $history);

            if ($next['action'] === 'final') {
                $answer = $next['answer'] ?? '';
                $steps[] = ['action' => 'final'];
                $this->audit($prompt, $steps, $answer, $userId);

                return ['answer' => $answer, 'steps' => $steps, 'final' => true];
            }

            if ($next['action'] !== 'tool_call' || empty($next['tool'])) {
                break;
            }

            $tool = $tools->find($next['tool']);
            if ($tool === null) {
                $steps[] = ['action' => 'tool_call', 'tool' => $next['tool'], 'error' => 'unknown tool'];
                break;
            }

            $args = is_array($next['args'] ?? null) ? $next['args'] : [];
            // Inject the caller so firm-scoped tools can look up context.
            if ($userId !== null) {
                $args['_user_id'] = $userId;
            }

            try {
                $observation = $tool->execute($args);
            } catch (Throwable $e) {
                Log::warning('agent_tool_failed', ['tool' => $tool->name(), 'error' => $e->getMessage()]);
                $observation = ['error' => 'Tool execution failed: '.$e->getMessage()];
            }

            $steps[] = [
                'action' => 'tool_call',
                'tool' => $tool->name(),
                'args' => $this->sanitiseArgs($args),
                'observation' => $observation,
            ];
            $history[] = ['role' => 'user', 'content' => $prompt];
            $history[] = ['role' => 'tool', 'content' => json_encode(['tool' => $tool->name(), 'observation' => $observation])];

            // If the observation contains an error, the model still gets one
            // more turn to explain it — no need to short-circuit.
        }

        // Cap hit — coerce a final answer from whatever the last observation was.
        $answer = $this->coerceFinalFromLastStep($steps);
        $this->audit($prompt, $steps, $answer, $userId);

        return ['answer' => $answer, 'steps' => $steps, 'final' => false];
    }

    /**
     * Sanitised copy of the args for logging — strip the internal
     * `_user_id` injection so audit rows don't confuse readers.
     *
     * @param  array<string, mixed>  $args
     */
    private function sanitiseArgs(array $args): array
    {
        unset($args['_user_id']);

        return $args;
    }

    /** @param list<array<string, mixed>> $steps */
    private function coerceFinalFromLastStep(array $steps): string
    {
        for ($i = count($steps) - 1; $i >= 0; $i--) {
            if (isset($steps[$i]['observation'])) {
                if (isset($steps[$i]['observation']['error'])) {
                    return $steps[$i]['observation']['error'];
                }

                return "I gathered some data but couldn't compose a final answer within ".self::MAX_STEPS.' steps. Latest observation attached.';
            }
        }

        return "I couldn't decide how to answer that. Try rephrasing with a zone name or a specific metric.";
    }

    /** @param list<array<string, mixed>> $steps */
    private function audit(string $prompt, array $steps, string $answer, ?int $userId): void
    {
        Audit::record('agent.run', null, null, [
            'user_id' => $userId,
            'prompt' => $prompt,
            'step_count' => count($steps),
            'tools' => array_values(array_filter(array_map(fn ($s) => $s['tool'] ?? null, $steps))),
            'answer_len' => strlen($answer),
        ]);
    }
}
