<?php

declare(strict_types=1);

namespace App\Services\Agents\Tools;

use App\Models\MethodologyVersion;
use App\Services\Agents\BaseAgentTool;
use App\Services\ScoreCalculator;
use App\Support\Pillars;

class MethodologyTool extends BaseAgentTool
{
    public function __construct(private ScoreCalculator $calc) {}

    public function name(): string
    {
        return 'methodology';
    }

    public function description(): string
    {
        return 'Return the current Vitality Index methodology — the live pillars, their sources and vintages, the weight vector, and the score bands. Use when the user asks "how does the score work?", "what goes into the water score?", or "how are missing readings handled?".';
    }

    public function parameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'pillar' => [
                    'type' => 'string',
                    'enum' => Pillars::keys(),
                    'description' => 'Filter to a single pillar. Omit for the full methodology.',
                ],
            ],
        ];
    }

    public function execute(array $args): array
    {
        $version = MethodologyVersion::current();

        $pillars = Pillars::all();
        if (isset($args['pillar'])) {
            $one = Pillars::find((string) $args['pillar']);
            $pillars = $one === null ? [] : [$one];
        }

        return [
            'version' => $version?->version ?? 'unversioned',
            'published_at' => $version?->published_at?->toIso8601String(),
            'registry_version' => Pillars::version(),
            'weights' => $version?->weights ?? $this->calc->getWeights(),
            'bands' => $version?->bands ?? [],
            'pillars' => $pillars,
            'notes' => [
                'Nulls are excluded from averages — never treated as zero.',
                'Composite = weighted mean of the pillars that have a reading, renormalized over exactly those pillars.',
                'A pillar marked "held" is shown with its vintage but carries zero weight.',
            ],
        ];
    }
}
