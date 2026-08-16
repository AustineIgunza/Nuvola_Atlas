<?php

namespace App\Http\Controllers;

use App\Services\ScoreCalculator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class VitalityController extends Controller
{
    public function methodology(ScoreCalculator $calculator)
    {
        $data = Cache::remember('vitality_methodology', 86400, fn () => [
            'pillars' => config('methodology'),
            'weights' => $calculator->getWeights(),
        ]);

        return response()->json($data);
    }

    /**
     * County-wide Vitality summary, read straight off the
     * `county_vitality_rollup` materialized view. The view is rebuilt by
     * `nuvola:refresh-county-rollup` overnight, so `refreshed_at` is the
     * honest as-of timestamp rather than request time.
     */
    public function county()
    {
        $row = DB::table('county_vitality_rollup')->first();

        return response()->json([
            'data' => [
                'county' => $row->county,
                'zone_count' => (int) $row->zone_count,
                'scored_zone_count' => (int) $row->scored_zone_count,
                'avg_score' => $row->avg_score === null ? null : (int) $row->avg_score,
                'min_score' => $row->min_score === null ? null : (int) $row->min_score,
                'max_score' => $row->max_score === null ? null : (int) $row->max_score,
                'pillars' => [
                    'social' => $row->pillar_social === null ? null : (int) $row->pillar_social,
                    'safety' => $row->pillar_safety === null ? null : (int) $row->pillar_safety,
                    'density' => $row->pillar_density === null ? null : (int) $row->pillar_density,
                    'infra' => $row->pillar_infra === null ? null : (int) $row->pillar_infra,
                ],
                'indicators_present' => (int) $row->indicators_present,
                'indicators_total' => (int) $row->indicators_total,
                'refreshed_at' => $row->refreshed_at,
            ],
        ]);
    }
}
