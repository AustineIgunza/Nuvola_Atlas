<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\ZoneHistoryResource;
use App\Models\Zone;
use App\Support\Pillars;
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
        // Average each pillar column per bucket so the chart-ready wire format
        // matches the live Zones endpoint.
        $columns = [];
        foreach (Pillars::keys() as $key) {
            $columns[$key] = Pillars::column($key);
        }

        $query = DB::table('zone_score_snapshots')
            ->where('zone_id', $zoneId)
            ->where('captured_at', '>=', now()->subHours($hours))
            ->selectRaw('date_trunc(?, captured_at) as bucket', [$bucket])
            ->selectRaw('AVG(score)::int as score');

        foreach ($columns as $col) {
            $query->selectRaw("AVG({$col})::int as {$col}");
        }

        $rows = $query
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->get();

        return $rows->map(function ($row) use ($columns) {
            $pillars = [];
            foreach ($columns as $key => $col) {
                // AVG skips null snapshots, but a bucket where every snapshot
                // lacked this pillar averages to null — `(int) null` would plot
                // that gap on the trend chart as a crash to zero.
                $pillars[$key] = $row->$col === null ? null : (int) $row->$col;
            }

            return [
                't' => (string) $row->bucket,
                'score' => $row->score === null ? null : (int) $row->score,
                'pillars' => $pillars,
            ];
        })->all();
    }
}
