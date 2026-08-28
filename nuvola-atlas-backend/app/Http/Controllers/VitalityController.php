<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Domain\Scoring\ScoreCalculator;
use App\Support\Pillars;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class VitalityController extends Controller
{
    /**
     * The methodology is the registry. It used to be a separate hand-written
     * config, which meant the published description of a pillar and the
     * pillar the scorer actually used could drift apart without anything
     * failing. Serving the registry directly makes that impossible.
     */
    public function methodology(ScoreCalculator $calculator)
    {
        $data = Cache::remember('vitality_methodology', 86400, fn () => [
            'version' => Pillars::version(),
            'pillars' => Pillars::all(),
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

        $pillars = [];
        foreach (Pillars::keys() as $key) {
            $value = $row->{Pillars::column($key)} ?? null;
            $pillars[$key] = $value === null ? null : (int) $value;
        }

        return response()->json([
            'data' => [
                'county' => $row->county,
                'zone_count' => (int) $row->zone_count,
                'scored_zone_count' => (int) $row->scored_zone_count,
                'avg_score' => $row->avg_score === null ? null : (int) $row->avg_score,
                'min_score' => $row->min_score === null ? null : (int) $row->min_score,
                'max_score' => $row->max_score === null ? null : (int) $row->max_score,
                'pillars' => $pillars,
                'pillars_present' => (int) $row->pillars_present,
                'pillars_total' => (int) $row->pillars_total,
                'refreshed_at' => $row->refreshed_at,
            ],
        ]);
    }
}
