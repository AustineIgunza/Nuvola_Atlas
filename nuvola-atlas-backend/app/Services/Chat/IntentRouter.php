<?php

declare(strict_types=1);

namespace App\Services\Chat;

class IntentRouter
{
    private const INTENTS = [
        'trend', 'comparison', 'diagnostic', 'summary',
        'distribution', 'composition', 'methodology', 'unrelated',
    ];

    public function __construct(private readonly AiGatewayClient $client) {}

    /**
     * Route a user question to one of the fixed intents. Falls back to
     * "summary" on anything unparseable so the pipeline keeps flowing.
     *
     * @param  array<int, array{role: string, content: string}>  $recentTurns
     */
    public function route(string $prompt, array $recentTurns = []): string
    {
        $system = "Classify the user's question about Nairobi zone data into one of these intents:\n"
            . "- trend: change over time (e.g. 'how has X changed?')\n"
            . "- comparison: two or more zones vs each other\n"
            . "- diagnostic: 'why did X happen?', root-cause questions\n"
            . "- summary: 'give me a snapshot / overview'\n"
            . "- distribution: 'which zones are above N?', ranked lists\n"
            . "- composition: 'what makes up the score?', pillar breakdowns\n"
            . "- methodology: 'how does the score work?', not a data query\n"
            . "- unrelated: not about the platform\n\n"
            . "Respond with ONLY the intent word, lowercase, no punctuation.";

        $messages = array_merge(
            [['role' => 'system', 'content' => $system]],
            $recentTurns,
            [['role' => 'user', 'content' => $prompt]],
        );

        $out = $this->client->complete($messages, [
            'temperature' => 0,
            'max_tokens' => 8,
        ]);

        $intent = strtolower(trim($out['content']));
        return in_array($intent, self::INTENTS, true) ? $intent : 'summary';
    }
}
