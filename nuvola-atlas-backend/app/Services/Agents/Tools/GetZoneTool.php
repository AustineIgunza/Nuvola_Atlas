<?php

declare(strict_types=1);

namespace App\Services\Agents\Tools;

use App\Models\Zone;
use App\Services\Agents\BaseAgentTool;
use App\Services\ScoreCalculator;

class GetZoneTool extends BaseAgentTool
{
    public function __construct(private ScoreCalculator $calc) {}

    public function name(): string { return 'get_zone'; }

    public function description(): string
    {
        return 'Return the current Vitality Score + four pillar sub-scores + missing-indicator ledger for one Nairobi sub-county. Use this when the user names a specific zone.';
    }

    public function parameters(): array
    {
        return [
            'type' => 'object',
            'required' => ['zone_id'],
            'properties' => [
                'zone_id' => [
                    'type' => 'string',
                    'description' => 'The zone slug — e.g. "westlands", "kibra", "mathare", "starehe".',
                ],
            ],
        ];
    }

    public function execute(array $args): array
    {
        $id = (string) ($args['zone_id'] ?? '');
        $zone = Zone::find($id);
        if (! $zone) {
            return ['error' => "Zone '{$id}' does not exist.", 'zone_id' => $id];
        }
        $pillars = $this->calc->pillarScores($zone);
        $missing = $this->calc->missingIndicators($zone);

        return [
            'zone_id' => $zone->id,
            'name' => $zone->name,
            'score' => $zone->score,
            'pillars' => $pillars,
            'indicators_active' => 13 - count($missing),
            'indicators_total' => 13,
            'missing_indicators' => $missing,
            'last_sync_min' => $zone->last_sync_min,
        ];
    }
}
