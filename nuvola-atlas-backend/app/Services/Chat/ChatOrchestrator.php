<?php

declare(strict_types=1);

namespace App\Services\Chat;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Support\Audit;
use Generator;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Wires the whole pipeline: intent → SQL → guard → execute → insight.
 * Emits StreamEvent objects that the HTTP layer formats as SSE frames.
 * Persists the user + assistant messages once the turn is complete.
 */
class ChatOrchestrator
{
    public function __construct(
        private readonly IntentRouter $router,
        private readonly SqlGenerator $sqlGen,
        private readonly SqlGuard $guard,
        private readonly SqlExecutor $executor,
        private readonly InsightGenerator $insight,
    ) {}

    /**
     * @return Generator<int, StreamEvent>
     */
    public function handle(ChatConversation $conversation, string $prompt): Generator
    {
        $start = microtime(true);

        // Persist the user turn first so it appears in history even if the
        // pipeline explodes below.
        $userMsg = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $prompt,
        ]);

        $recentTurns = $this->recentContext($conversation, (int) config('ai.chat.max_context_messages'));
        $intent = null;
        $sqlRaw = null;
        $sqlSafe = null;
        $rows = [];
        $answer = '';
        $followups = [];

        try {
            $intent = $this->router->route($prompt, $recentTurns);
            yield new StreamEvent('intent', ['intent' => $intent]);

            $sqlRaw = $this->sqlGen->generate($prompt, $intent, $recentTurns);
            $sqlSafe = $this->guard->validate($sqlRaw);
            yield new StreamEvent('sql', ['sql' => $sqlSafe]);

            $result = $this->executor->run($sqlSafe);
            if (! $result['ok']) {
                yield new StreamEvent('error', ['error' => $result['error']]);
                $this->persistAssistant($conversation, $intent, $sqlSafe, [], $result['error'], $start);
                return;
            }
            $rows = $result['rows'];
            yield new StreamEvent('rows', [
                'count' => $result['count'],
                'preview' => array_slice($rows, 0, 10),
            ]);

            foreach ($this->insight->stream($prompt, $intent, $rows) as $delta) {
                $answer .= $delta;
                yield new StreamEvent('insight_delta', ['text' => $delta]);
            }

            $followups = $this->insight->followups($prompt, $intent, $rows);
            yield new StreamEvent('followups', ['followups' => $followups]);

            $assistant = $this->persistAssistant($conversation, $intent, $sqlSafe, $rows, $answer, $start, $followups);
            yield new StreamEvent('done', ['message_id' => $assistant->id]);

            Audit::record('chat.query', $conversation, null, [
                'user_id' => $conversation->user_id,
                'conversation_id' => $conversation->id,
                'prompt' => $prompt,
                'intent' => $intent,
                'sql' => $sqlSafe,
                'row_count' => count($rows),
            ]);
        } catch (Throwable $e) {
            Log::error('chat_pipeline_failed', [
                'user_id' => $conversation->user_id,
                'error' => $e->getMessage(),
                'intent' => $intent,
                'sql_raw' => $sqlRaw,
            ]);
            yield new StreamEvent('error', ['error' => $this->userSafeError($e)]);

            // Still persist a stub assistant row so the conversation has
            // a bookend and history looks consistent.
            $this->persistAssistant(
                $conversation,
                $intent,
                $sqlSafe,
                [],
                'Sorry — I could not answer that question. ' . $this->userSafeError($e),
                $start,
            );
        }

        // Touch the conversation so it moves to the top of the sidebar.
        $conversation->touch();
    }

    /**
     * @return array<int, array{role: string, content: string}>
     */
    private function recentContext(ChatConversation $c, int $limit): array
    {
        return $c->messages()
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->reverse()
            ->map(fn (ChatMessage $m) => [
                'role' => $m->role === 'assistant' ? 'assistant' : 'user',
                'content' => $m->content,
            ])
            ->values()
            ->all();
    }

    private function persistAssistant(
        ChatConversation $c,
        ?string $intent,
        ?string $sql,
        array $rows,
        string $content,
        float $start,
        array $followups = [],
    ): ChatMessage {
        $stored = array_slice($rows, 0, (int) config('ai.chat.max_result_rows'));

        // Followups piggyback on result_rows via a sentinel row so we don't
        // need a separate column for a 3-string array. The API resource
        // extracts them on the way out.
        if (! empty($followups)) {
            $stored[] = ['__followups__' => $followups];
        }

        return ChatMessage::create([
            'conversation_id' => $c->id,
            'role' => 'assistant',
            'content' => $content,
            'intent' => $intent,
            'generated_sql' => $sql,
            'result_rows' => $stored,
            'latency_ms' => (int) ((microtime(true) - $start) * 1000),
        ]);
    }

    private function userSafeError(Throwable $e): string
    {
        // Pipe validation errors through — they're already user-safe and
        // give useful signal ("Table `secrets` is not in the allowlist").
        if ($e instanceof \InvalidArgumentException) {
            return $e->getMessage();
        }
        return 'The assistant is unavailable right now.';
    }
}
