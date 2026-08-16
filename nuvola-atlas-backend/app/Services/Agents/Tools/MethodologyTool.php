<?php

declare(strict_types=1);

namespace App\Services\Agents\Tools;

use App\Models\MethodologyVersion;
use App\Services\Agents\BaseAgentTool;
use App\Services\ScoreCalculator;

class MethodologyTool extends BaseAgentTool
{
    public function __construct(private ScoreCalculator $calc) {}

    public function name(): string
    {
        return 'methodology';
    }

    public function description(): string
    {
        return 'Return the current Vitality Index methodology — the four pillars, 13 indicators, weight vector, and score bands. Use when the user asks "how does the score work?", "what goes into safety?", or "how are missing indicators handled?".';
    }

    public function parameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'pillar' => ['type' => 'string', 'enum' => ['social', 'safety', 'density', 'infra'], 'description' => 'Filter to a single pillar. Omit for the full methodology.'],
            ],
        ];
    }

    public function execute(array $args): array
    {
        $version = MethodologyVersion::current();
        $pillars = ScoreCalculator::pillars();
        if (isset($args['pillar']) && isset($pillars[$args['pillar']])) {
            $pillars = [$args['pillar'] => $pillars[$args['pillar']]];
        }

        return [
            'version' => $version?->version ?? 'unversioned',
            'published_at' => $version?->published_at?->toIso8601String(),
            'weights' => $version?->weights ?? $this->calc->getWeights(),
            'bands' => $version?->bands ?? [],
            'pillars' => $pillars,
            'notes' => [
                'Nulls are excluded from averages — never treated as zero.',
                'Composite = simple average of pillars with at least one non-null indicator.',
            ],
        ];
    }
}
