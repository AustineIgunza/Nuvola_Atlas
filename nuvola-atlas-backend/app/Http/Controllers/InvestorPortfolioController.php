<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\PortfolioResource;
use App\Models\FirmWatchlist;
use App\Models\User;
use App\Models\ZoneScoreSnapshot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Phase F — /investor/portfolio.
 *
 * Composite Vitality Score rollup across a firm's watchlisted zones,
 * plus a 4-week trend line built from `zone_score_snapshots` (per-zone
 * time-series shipped 2026-07-08).
 *
 * Trend is the daily mean of watchlisted-zone scores over the last 28
 * days. Zones with no snapshots in the window are excluded — the trend
 * cannot lie about coverage it does not have.
 */
class InvestorPortfolioController extends Controller
{
    public function show(Request $request): PortfolioResource
    {
        /** @var User $user */
        $user = $request->user();
        $firmId = $user->primary_firm_id;

        if ($firmId === null) {
            abort(403, 'This route requires an assigned firm.');
        }

        $entries = FirmWatchlist::query()
            ->with('zone')
            ->where('firm_id', $firmId)
            ->orderBy('priority')
            ->get();

        $holdings = $entries->map(function (FirmWatchlist $entry) {
            return [
                'zone_id' => $entry->zone_id,
                'zone_name' => $entry->zone?->name,
                'score' => $entry->zone?->score,
                'priority' => $entry->priority,
                'thesis' => $entry->thesis,
            ];
        })->values()->all();

        $scores = collect($holdings)->pluck('score')->filter(fn ($s) => $s !== null);
        $composite = $scores->count() > 0 ? round($scores->avg(), 1) : null;

        $topRow = collect($holdings)->filter(fn ($h) => $h['score'] !== null)->sortByDesc('score')->first();
        $bottomRow = collect($holdings)->filter(fn ($h) => $h['score'] !== null)->sortBy('score')->first();

        $trend = $this->trend($entries->pluck('zone_id')->all());

        return new PortfolioResource([
            'firm' => [
                'id' => $user->primaryFirm?->id,
                'name' => $user->primaryFirm?->name,
                'tier' => $user->primaryFirm?->tier->value,
            ],
            'composite' => [
                'score' => $composite,
                'count' => $scores->count(),
                'top' => $topRow['zone_name'] ?? null,
                'bottom' => $bottomRow['zone_name'] ?? null,
            ],
            'trend' => $trend,
            'holdings' => $holdings,
        ]);
    }

    /**
     * Daily mean score across the given zones over the last 28 days.
     *
     * @param  list<string> $zoneIds
     * @return list<array{captured_at: string, score: float}>
     */
    private function trend(array $zoneIds): array
    {
        if (empty($zoneIds)) {
            return [];
        }

        return ZoneScoreSnapshot::query()
            ->selectRaw("date_trunc('day', captured_at) as bucket, avg(score) as avg_score")
            ->whereIn('zone_id', $zoneIds)
            ->where('captured_at', '>=', now()->subDays(28))
            ->groupBy(DB::raw("date_trunc('day', captured_at)"))
            ->orderBy('bucket')
            ->get()
            ->map(fn ($row) => [
                'captured_at' => (string) $row->bucket,
                'score' => round((float) $row->avg_score, 1),
            ])
            ->values()
            ->all();
    }
}
