<?php

declare(strict_types=1);

namespace App\Services\Watchlist;

use App\Models\Firm;
use App\Models\FirmWatchlist;
use App\Models\Zone;
use App\Services\ScoreCalculator;
use Illuminate\Support\Collection;

/**
 * Read/write layer over `firm_watchlists`. Keeps the controller thin and
 * gives Phase G (ML fit models) a single seam to plug into.
 *
 * Read paths never cross firms — every query is scoped by `firm_id`. The
 * controller layer plus `firm.scope` middleware guarantee the caller has a
 * firm at all; this service assumes that guarantee has already fired.
 */
class WatchlistService
{
    public function __construct(private ScoreCalculator $calc) {}

    /** @return Collection<int, FirmWatchlist> */
    public function forFirm(Firm $firm): Collection
    {
        return FirmWatchlist::with('zone')
            ->where('firm_id', $firm->id)
            ->orderBy('priority')
            ->get();
    }

    public function add(Firm $firm, string $zoneId, int $priority = 3, ?string $thesis = null): FirmWatchlist
    {
        return FirmWatchlist::create([
            'firm_id' => $firm->id,
            'zone_id' => $zoneId,
            'priority' => $priority,
            'thesis' => $thesis,
        ]);
    }

    public function updateEntry(FirmWatchlist $entry, array $changes): FirmWatchlist
    {
        $entry->fill(array_filter($changes, fn ($v) => $v !== null))->save();

        return $entry->refresh();
    }

    public function remove(FirmWatchlist $entry): void
    {
        $entry->delete();
    }

    /**
     * Rank non-watchlisted zones by the firm-tier weight vector.
     *
     * @return array<int, array{zone_id: string, zone_name: string, score: ?int, fit: ?float}>
     */
    public function opportunities(Firm $firm, int $limit = 10): array
    {
        $watchedIds = FirmWatchlist::query()
            ->where('firm_id', $firm->id)
            ->pluck('zone_id')
            ->all();

        $weights = $firm->tier->opportunityWeights();

        return Zone::query()
            ->whereNotIn('id', $watchedIds)
            ->get()
            ->map(function (Zone $zone) use ($weights) {
                $pillars = $this->calc->pillarScores($zone);
                $total = 0.0;
                $wsum = 0.0;
                foreach ($weights as $k => $w) {
                    if ($pillars[$k] === null) {
                        continue;
                    }
                    $total += $pillars[$k] * $w;
                    $wsum += $w;
                }

                return [
                    'zone_id' => $zone->id,
                    'zone_name' => $zone->name,
                    'score' => $zone->score,
                    'fit' => $wsum > 0 ? round($total / $wsum, 2) : null,
                ];
            })
            ->sortByDesc('fit')
            ->take($limit)
            ->values()
            ->all();
    }
}
