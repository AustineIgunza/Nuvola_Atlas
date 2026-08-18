<?php

declare(strict_types=1);

namespace App\Services\Agents\Tools;

use App\Models\Zone;
use App\Services\Agents\BaseAgentTool;

class ListZonesTool extends BaseAgentTool
{
    public function name(): string
    {
        return 'list_zones';
    }

    public function description(): string
    {
        return 'List all Nairobi sub-counties with their current composite Vitality Scores, optionally ordered and filtered. Use for "top N zones", leaderboard, "zones above X" style questions.';
    }

    public function parameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'order' => ['type' => 'string', 'enum' => ['asc', 'desc'], 'default' => 'desc'],
                'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 50, 'default' => 10],
                'min_score' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100],
                'max_score' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100],
            ],
        ];
    }

    public function execute(array $args): array
    {
        $order = ($args['order'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $limit = min(50, max(1, (int) ($args['limit'] ?? 10)));

        $query = Zone::query()->select('id', 'name', 'score', 'last_sync_min');
        if (isset($args['min_score'])) {
            $query->where('score', '>=', (int) $args['min_score']);
        }
        if (isset($args['max_score'])) {
            $query->where('score', '<=', (int) $args['max_score']);
        }
        // Postgres puts NULLs first on DESC, so an unscoreable zone would have
        // led "top zones" outright. It is not the best or the worst — it is
        // unknown, so it sorts last whichever way the caller asked.
        $rows = $query->orderByRaw("score {$order} NULLS LAST")->limit($limit)->get();

        return [
            'count' => $rows->count(),
            'zones' => $rows->map(fn (Zone $z) => [
                'zone_id' => $z->id,
                'name' => $z->name,
                'score' => $z->score,
                'last_sync_min' => $z->last_sync_min,
            ])->values()->all(),
        ];
    }
}
