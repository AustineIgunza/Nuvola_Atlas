<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\Agents\AgentRuntime;
use App\Services\Agents\ToolRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * POST /api/v1/assistant/agent — one-shot agent turn.
 *
 * Body: { "prompt": "<user text>" }
 * Returns: { "answer": "...", "steps": [...], "final": true|false, "provider": "..." }
 *
 * The whole loop runs synchronously (max 4 tool calls). If the pilot
 * later needs streaming, wrap this in an SSE controller — the runtime
 * already exposes `steps` progressively so it's ready for it.
 *
 * GET /api/v1/assistant/agent/tools — discovery endpoint the SPA hits
 * to show what the assistant can do.
 */
class AssistantAgentController extends Controller
{
    public function __construct(
        private AgentRuntime $runtime,
        private ToolRegistry $registry,
    ) {}

    public function tools(Request $request): JsonResponse
    {
        return response()->json([
            'provider' => (string) config('services.agents.provider', 'heuristic'),
            'tools' => $this->registry->forUser($request->user())->schemas(),
        ]);
    }

    public function run(Request $request): JsonResponse
    {
        $data = $request->validate([
            'prompt' => ['required', 'string', 'min:2', 'max:1000'],
        ]);

        $result = $this->runtime->run($data['prompt'], $request->user());

        return response()->json([
            'answer' => $result['answer'],
            'steps' => $result['steps'],
            'final' => $result['final'],
            'provider' => (string) config('services.agents.provider', 'heuristic'),
        ]);
    }
}
