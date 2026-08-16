<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\ZoneHistoryResource;
use App\Models\Zone;
use App\Services\ScoreCalculator;
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
        // Aggregate the 13 indicator columns per bucket, then compute the four
        // pillar averages in PHP via ScoreCalculator so the chart-ready wire
        // format matches the live Zones endpoint.
        $calc = new ScoreCalculator;
        $indicatorAggregates = [];
        foreach (ScoreCalculator::pillars() as $pillar => $indicators) {
            foreach ($indicators as $slug) {
                $indicatorAggregates[] = 'indicator_'.$slug;
            }
        }

        $query = DB::table('zone_score_snapshots')
            ->where('zone_id', $zoneId)
            ->where('captured_at', '>=', now()->subHours($hours))
            ->selectRaw('date_trunc(?, captured_at) as bucket', [$bucket])
            ->selectRaw('AVG(score)::int as score');

        foreach ($indicatorAggregates as $col) {
            $query->selectRaw("AVG({$col})::int as {$col}");
        }

        $rows = $query
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->get();

        return $rows->map(function ($row) use ($calc) {
            $values = [];
            foreach (ScoreCalculator::pillars() as $indicators) {
                foreach ($indicators as $slug) {
                    $col = 'indicator_'.$slug;
                    $values[$slug] = isset($row->$col) ? (int) $row->$col : null;
                }
            }

            $pillars = $calc->pillarScoresFromValues($values);

            return [
                't' => (string) $row->bucket,
                'score' => (int) $row->score,
                'pillars' => [
                    'social' => $pillars['social'],
                    'safety' => $pillars['safety'],
                    'density' => $pillars['density'],
                    'infra' => $pillars['infra'],
                ],
            ];
        })->all();
    }
}
