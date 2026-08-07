<?php

declare(strict_types=1);

namespace App\Services\Agents;

/**
 * Contract every agent tool must implement.
 *
 * `schema()` describes the tool in a shape identical to the OpenAI /
 * Anthropic tool-use spec so a downstream LLM (or a heuristic router)
 * can route the same descriptor. `execute($args)` returns a JSON-safe
 * array — the runtime serialises it and feeds it back to the model as
 * the next observation.
 */
interface AgentTool
{
    public function name(): string;

    public function description(): string;

    /**
     * JSON schema for the tool's parameters (draft-2020-12 subset).
     * @return array<string, mixed>
     */
    public function parameters(): array;

    /**
     * @param  array<string, mixed>  $args
     * @return array<string, mixed>|list<mixed>
     */
    public function execute(array $args): array;

    /**
     * Full descriptor for the LLM / router.
     * @return array{name: string, description: string, parameters: array<string, mixed>}
     */
    public function schema(): array;
}
