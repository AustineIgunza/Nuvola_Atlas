<?php

declare(strict_types=1);

namespace App\Domain\Scoring;

use App\Models\Zone;
use App\Models\ZoneScoreSnapshot;
use App\Support\Pillars;
use Illuminate\Support\Facades\DB;

/**
 * Per-pillar movement between a zone's oldest snapshot inside the lookback
 * window and its current values.
 *
 * A delta is a claim about direction, so it is null unless the history can
 * actually support it. Null is returned when: the zone has fewer than two
 * snapshots in the window (nothing to compare against), the pillar has no
 * score now, or the pillar had no score at the baseline. Zero is reserved
 * for a pillar that genuinely did not move.
 *
 * `windowDays` is the real age of the baseline, not WINDOW_DAYS — the UI has
 * to label the number with the period it actually covers rather than
 * assuming a full quarter.
 */
class PillarDeltaCalculator
{
    public const WINDOW_DAYS = 90;

    public function __construct(private readonly ScoreCalculator $calc = new ScoreCalculator) {}

    /**
     * Shape returned for a zone with no usable history. Also what
     * ZoneResource falls back to when nothing was preloaded.
     *
     * @return array{deltas: array<string, ?int>, windowDays: ?int}
     */
    public static function unknown(): array
    {
        return ['deltas' => Pillars::fill(null), 'windowDays' => null];
    }

    /**
     * Batch-load deltas for a set of zones — two queries regardless of how
     * many zones are passed, so the paginated list does not go N+1.
     *
     * @param  iterable<Zone>  $zones
     * @return array<string, array{deltas: array{social: ?int, safety: ?int, density: ?int, infra: ?int}, windowDays: ?int}>
     */
    public function forZones(iterable $zones): array
    {
        /** @var array<string, Zone> $byId */
        $byId = [];
        foreach ($zones as $zone) {
            $byId[$zone->id] = $zone;
        }

        $out = array_fill_keys(array_keys($byId), self::unknown());
        if ($byId === []) {
            return $out;
        }

        $windowStart = now()->subDays(self::WINDOW_DAYS);

        $summaries = DB::table('zone_score_snapshots')
            ->whereIn('zone_id', array_keys($byId))
            ->where('captured_at', '>=', $windowStart)
            ->groupBy('zone_id')
            ->selectRaw('zone_id, MIN(captured_at) as baseline_at, COUNT(*) as snapshots')
            ->get()
            // One snapshot is a starting point, not a trend.
            ->filter(fn ($row) => (int) $row->snapshots >= 2)
            ->all();

        if ($summaries === []) {
            return $out;
        }

        $baselines = ZoneScoreSnapshot::query()
            ->where(function ($query) use ($summaries) {
                foreach ($summaries as $row) {
                    $query->orWhere(fn ($w) => $w
                        ->where('zone_id', $row->zone_id)
                        ->where('captured_at', $row->baseline_at));
                }
            })
            ->get()
            ->keyBy('zone_id');

        foreach ($summaries as $row) {
            $baseline = $baselines->get($row->zone_id);
            if ($baseline === null) {
                continue;
            }

            $out[$row->zone_id] = [
                'deltas' => $this->diff($byId[$row->zone_id], $baseline),
                'windowDays' => (int) round($baseline->captured_at->diffInDays(now())),
            ];
        }

        return $out;
    }

    /**
     * @return array<string, ?int>
     */
    private function diff(Zone $zone, ZoneScoreSnapshot $baseline): array
    {
        $now = $this->calc->pillarScores($zone);
        $then = $this->calc->pillarScoresFromValues($this->snapshotPillars($baseline));

        $deltas = Pillars::fill(null);
        foreach (array_keys($deltas) as $pillar) {
            if ($now[$pillar] === null || $then[$pillar] === null) {
                continue;
            }
            $deltas[$pillar] = $now[$pillar] - $then[$pillar];
        }

        return $deltas;
    }

    /**
     * @return array<string, ?int>
     */
    private function snapshotPillars(ZoneScoreSnapshot $snapshot): array
    {
        $values = [];
        foreach (Pillars::keys() as $key) {
            $raw = $snapshot->getAttribute(Pillars::column($key));
            $values[$key] = $raw === null ? null : (int) $raw;
        }

        return $values;
    }
}
