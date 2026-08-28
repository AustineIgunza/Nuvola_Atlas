<?php

declare(strict_types=1);

namespace App\Services\Agents\Tools;

use App\Domain\Scoring\ScoreCalculator;
use App\Models\Zone;
use App\Services\Agents\BaseAgentTool;
use App\Support\Pillars;

class CompareZonesTool extends BaseAgentTool
{
    public function __construct(private ScoreCalculator $calc) {}

    public function name(): string
    {
        return 'compare_zones';
    }

    public function description(): string
    {
        return 'Compare 2-5 zones side-by-side across composite score + four pillars. Use for "X vs Y", "how does A compare to B", ranking a shortlist.';
    }

    public function parameters(): array
    {
        return [
            'type' => 'object',
            'required' => ['zone_ids'],
            'properties' => [
                'zone_ids' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                    'minItems' => 2,
                    'maxItems' => 5,
                ],
            ],
        ];
    }

    public function execute(array $args): array
    {
        $ids = array_values(array_filter((array) ($args['zone_ids'] ?? []), 'is_string'));
        $ids = array_slice($ids, 0, 5);
        if (count($ids) < 2) {
            return ['error' => 'compare_zones needs at least two zone_ids.'];
        }

        $zones = Zone::query()->whereIn('id', $ids)->get()->keyBy('id');
        $rows = [];
        foreach ($ids as $id) {
            $zone = $zones->get($id);
            if (! $zone) {
                $rows[] = ['zone_id' => $id, 'error' => 'not found'];

                continue;
            }
            $pillars = $this->calc->pillarScores($zone);
            $rows[] = [
                'zone_id' => $zone->id,
                'name' => $zone->name,
                'score' => $zone->score,
                'pillars' => $pillars,
            ];
        }

        // Winner per pillar (null-safe) + winner overall.
        $winners = ['overall' => null] + Pillars::fill(null);
        foreach ($winners as $key => &$holder) {
            $best = null;
            foreach ($rows as $row) {
                if (isset($row['error'])) {
                    continue;
                }
                $value = $key === 'overall' ? $row['score'] : ($row['pillars'][$key] ?? null);
                if ($value === null) {
                    continue;
                }
                if ($best === null || $value > $best['value']) {
                    $best = ['zone_id' => $row['zone_id'], 'value' => $value];
                }
            }
            $holder = $best;
        }

        return ['zones' => $rows, 'winners' => $winners];
    }
}
