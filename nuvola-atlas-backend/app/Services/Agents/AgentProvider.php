<?php

declare(strict_types=1);

namespace App\Services\Agents;

/**
 * Provider contract — one method per turn.
 *
 * The runtime hands the provider the user's original prompt, the tool
 * schemas, and the observations accumulated so far. Provider replies
 * with either a tool call (name + args) OR a final answer.
 */
interface AgentProvider
{
    /**
     * @param  array<int, array{name: string, description: string, parameters: array<string,mixed>}> $tools
     * @param  array<int, array{role: string, content: string}> $history
     * @return array{action: 'tool_call'|'final', tool?: string, args?: array<string,mixed>, answer?: string, reasoning?: string}
     */
    public function nextStep(string $prompt, array $tools, array $history): array;
}
