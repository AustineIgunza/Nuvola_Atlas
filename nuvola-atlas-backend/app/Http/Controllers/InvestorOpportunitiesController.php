<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\FirmWatchlist;
use App\Models\User;
use App\Models\Zone;
use App\Services\ScoreCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Phase F — /investor/opportunities.
 *
 * Non-watchlisted zones ranked by a tier-aware weighted heuristic —
 * v1 rule per Backend Build Plan §14.1: transparent, weight-vector
 * driven by FirmTier::opportunityWeights().
 *
 * Anything more sophisticated (ML fit against firm outcome history)
 * is Phase G scope and deliberately excluded here.
 */
class InvestorOpportunitiesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $firm = $user->primaryFirm;

        if (! $firm) {
            abort(403, 'This route requires an assigned firm.');
        }

        $watchlistedIds = FirmWatchlist::query()
            ->where('firm_id', $firm->id)
            ->pluck('zone_id')
            ->all();

        $weights = $firm->tier->opportunityWeights();
        $calc = new ScoreCalculator;

        $ranked = Zone::query()
            ->whereNotIn('id', $watchlistedIds)
            ->get()
            ->map(function (Zone $zone) use ($calc, $weights) {
                $pillars = $calc->pillarScores($zone);
                $rank = $this->weightedScore($pillars, $weights);

                return [
                    'zone_id' => $zone->id,
                    'zone_name' => $zone->name,
                    'score' => $zone->score,
                    'weighted_fit' => $rank,
                    'pillars' => $pillars,
                ];
            })
            ->sortByDesc('weighted_fit')
            ->values()
            ->take(10)
            ->all();

        return response()->json([
            'firm_tier' => $firm->tier->value,
            'weights' => $weights,
            'data' => $ranked,
        ]);
    }

    /**
     * @param  array{social: ?int, safety: ?int, density: ?int, infra: ?int}  $pillars
     * @param  array{social: float, safety: float, density: float, infra: float}  $weights
     */
    private function weightedScore(array $pillars, array $weights): ?float
    {
        $total = 0.0;
        $weightSum = 0.0;
        foreach ($weights as $key => $w) {
            if ($pillars[$key] === null) {
                continue;
            }
            $total += $pillars[$key] * $w;
            $weightSum += $w;
        }

        return $weightSum > 0 ? round($total / $weightSum, 2) : null;
    }
}
