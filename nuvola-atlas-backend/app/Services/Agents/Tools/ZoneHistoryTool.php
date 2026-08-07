<?php

declare(strict_types=1);

namespace App\Services\Agents\Tools;

use App\Models\ZoneScoreSnapshot;
use App\Services\Agents\BaseAgentTool;
use Illuminate\Support\Facades\DB;

class ZoneHistoryTool extends BaseAgentTool
{
    public function name(): string { return 'zone_history'; }

    public function description(): string
    {
        return 'Return the score trend for one zone over the last N days as a daily-mean series. Use for "how has X changed", "trend for Y", "is Z improving?" questions.';
    }

    public function parameters(): array
    {
        return [
            'type' => 'object',
            'required' => ['zone_id'],
            'properties' => [
                'zone_id' => ['type' => 'string'],
                'days' => ['type' => 'integer', 'minimum' => 7, 'maximum' => 365, 'default' => 30],
            ],
        ];
    }

    public function execute(array $args): array
    {
        $zoneId = (string) ($args['zone_id'] ?? '');
        $days = min(365, max(7, (int) ($args['days'] ?? 30)));

        $rows = ZoneScoreSnapshot::query()
            ->selectRaw("date_trunc('day', captured_at) as bucket, avg(score) as avg_score, avg(pillar_social) as social, avg(pillar_safety) as safety, avg(pillar_density) as density, avg(pillar_infra) as infra")
            ->where('zone_id', $zoneId)
            ->where('captured_at', '>=', now()->subDays($days))
            ->groupBy(DB::raw("date_trunc('day', captured_at)"))
            ->orderBy('bucket')
            ->get();

        if ($rows->isEmpty()) {
            return ['zone_id' => $zoneId, 'days' => $days, 'series' => [], 'note' => 'No snapshot history available yet.'];
        }

        $series = $rows->map(fn ($r) => [
            'date' => (string) $r->bucket,
            'score' => round((float) $r->avg_score, 1),
            'pillars' => [
                'social' => $r->social !== null ? round((float) $r->social, 1) : null,
                'safety' => $r->safety !== null ? round((float) $r->safety, 1) : null,
                'density' => $r->density !== null ? round((float) $r->density, 1) : null,
                'infra' => $r->infra !== null ? round((float) $r->infra, 1) : null,
            ],
        ])->all();

        $first = $series[0]['score'];
        $last = end($series)['score'];

        return [
            'zone_id' => $zoneId,
            'days' => $days,
            'points' => count($series),
            'delta' => round($last - $first, 1),
            'direction' => $last > $first ? 'up' : ($last < $first ? 'down' : 'flat'),
            'series' => $series,
        ];
    }
}
