<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\ZoneHistoryResource;
use App\Models\Zone;
use App\Models\ZoneScoreSnapshot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ZoneHistoryController extends Controller
{
    private const RANGES = [
        'day' => ['hours' => 24, 'bucket' => 'hour'],
        'week' => ['hours' => 24 * 7, 'bucket' => 'day'],
        'month' => ['hours' => 24 * 30, 'bucket' => 'day'],
    ];

    public function show(string $id, Request $request)
    {
        $range = $request->input('range', 'week');

        $request->merge(['range' => $range]);
        $request->validate([
            'range' => 'in:day,week,month',
        ]);

        $zone = Zone::findOrFail($id);

        $config = self::RANGES[$range];
        $points = $this->fetchAggregated($zone->id, $config['hours'], $config['bucket']);

        return new ZoneHistoryResource([
            'range' => $range,
            'points' => $points,
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function fetchAggregated(string $zoneId, int $hours, string $bucket): array
    {
        // 'hour' bucket for range=day returns raw hourly rows (up to 24);
        // 'day' bucket for week/month averages the pillar values per calendar
        // day so the client always gets a compact, chart-ready series.
        $rows = DB::table('zone_score_snapshots')
            ->where('zone_id', $zoneId)
            ->where('captured_at', '>=', now()->subHours($hours))
            ->selectRaw("date_trunc(?, captured_at) as bucket", [$bucket])
            ->selectRaw('AVG(score)::int as score')
            ->selectRaw('AVG(pillar_social)::int as pillar_social')
            ->selectRaw('AVG(pillar_safety)::int as pillar_safety')
            ->selectRaw('AVG(pillar_density)::int as pillar_density')
            ->selectRaw('AVG(pillar_infra)::int as pillar_infra')
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->get();

        return $rows->map(fn ($row) => [
            't' => (string) $row->bucket,
            'score' => (int) $row->score,
            'pillars' => [
                'social' => (int) $row->pillar_social,
                'safety' => (int) $row->pillar_safety,
                'density' => (int) $row->pillar_density,
                'infra' => (int) $row->pillar_infra,
            ],
        ])->all();
    }
}
