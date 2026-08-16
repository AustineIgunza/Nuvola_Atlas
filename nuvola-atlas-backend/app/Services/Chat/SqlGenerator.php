<?php

declare(strict_types=1);

namespace App\Services\Chat;

class SqlGenerator
{
    public function __construct(
        private readonly AiGatewayClient $client,
        private readonly SchemaCatalog $catalog,
    ) {}

    /**
     * Turn the user's question into a Postgres SELECT.
     *
     * @param  array<int, array{role: string, content: string}>  $recentTurns
     */
    public function generate(string $prompt, string $intent, array $recentTurns = []): string
    {
        $system = $this->catalog->forPrompt()
            ."\n\nThe user's intent is: {$intent}.\n"
            .'Return ONLY a single SELECT statement. No explanation, no markdown fences, no comments.';

        $messages = array_merge(
            [['role' => 'system', 'content' => $system]],
            $recentTurns,
            [['role' => 'user', 'content' => $prompt]],
        );

        $out = $this->client->complete($messages, [
            'temperature' => 0,
            'max_tokens' => 400,
        ]);

        return $this->cleanFences(trim($out['content']));
    }

    /**
     * Some models still slip a ```sql ... ``` fence around the output even
     * when asked not to. Strip it once so the guard sees plain SQL.
     */
    private function cleanFences(string $sql): string
    {
        if (str_starts_with($sql, '```')) {
            $sql = preg_replace('/^```[a-z]*\n?/i', '', $sql) ?? $sql;
            $sql = preg_replace('/\n?```$/', '', $sql) ?? $sql;
        }

        return trim($sql);
    }
}
