<?php

declare(strict_types=1);

namespace App\Services\Chat;

use Generator;

class InsightGenerator
{
    public function __construct(private readonly AiGatewayClient $client) {}

    /**
     * Streams a natural-language explanation of the result set. Yields
     * text deltas as the LLM produces them so the frontend can render
     * the answer as it comes.
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @return Generator<int, string>
     */
    public function stream(string $prompt, string $intent, array $rows): Generator
    {
        // Cap what we send back to the model — sending 200 rows of 20 cols
        // burns tokens for no benefit. First 20 rows tell it the shape.
        $sample = array_slice($rows, 0, 20);

        $system = "You explain Postgres query results to a Nairobi urban planner.\n"
            . "Rules:\n"
            . "- Answer in 3-6 sentences. Plain English, no code.\n"
            . "- Ground every claim in the numbers you were given. Do not speculate about causes not present in the data.\n"
            . "- If the result set is empty, say so and suggest one refined question.\n"
            . "- Intent: {$intent}.\n"
            . "- The rows come from Navuuna's Postgres — pillar scores are 0-100, deltas are quarter-over-quarter.";

        $userBlock = "Question: {$prompt}\n\n"
            . "Result rows (" . count($rows) . " total, first " . count($sample) . " shown):\n"
            . json_encode($sample, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        $messages = [
            ['role' => 'system', 'content' => $system],
            ['role' => 'user', 'content' => $userBlock],
        ];

        yield from $this->client->stream($messages, [
            'temperature' => 0.3,
            'max_tokens' => 400,
        ]);
    }

    /**
     * Second, cheap, non-streaming call to produce 3 follow-up questions.
     * Runs after the insight so the UI can render the chips at the end.
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @return array<int, string>
     */
    public function followups(string $prompt, string $intent, array $rows): array
    {
        $sample = array_slice($rows, 0, 5);
        $columns = ! empty($sample) ? array_keys($sample[0]) : [];

        $messages = [
            ['role' => 'system', 'content' =>
                "Suggest 3 short follow-up questions a Nairobi planner might ask next, "
                . "grounded on these result columns and the original question. "
                . "Respond with a JSON array of 3 strings, nothing else."
            ],
            ['role' => 'user', 'content' =>
                "Original: {$prompt}\n"
                . "Intent: {$intent}\n"
                . "Columns available: " . implode(', ', $columns)
            ],
        ];

        $out = $this->client->complete($messages, [
            'temperature' => 0.5,
            'max_tokens' => 200,
        ]);

        $decoded = json_decode($this->stripFences($out['content']), true);
        if (! is_array($decoded)) {
            return [];
        }
        return array_values(array_filter(array_map('strval', $decoded)));
    }

    private function stripFences(string $s): string
    {
        $s = trim($s);
        if (str_starts_with($s, '```')) {
            $s = preg_replace('/^```[a-z]*\n?/i', '', $s) ?? $s;
            $s = preg_replace('/\n?```$/', '', $s) ?? $s;
        }
        return trim($s);
    }
}
