<?php

declare(strict_types=1);

namespace App\Services\Forecast;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Simple double-exponential-smoothing (Holt) forecast for a zone's
 * vitality score. Trained on the last 30 days of hourly snapshots
 * (averaged to a daily series), projected `$horizon` days forward, with
 * a symmetric confidence band derived from the training residual stdev.
 *
 * This is deliberately a small, transparent forecaster — the demo needs
 * "we can predict tomorrow", not "we shipped ARIMA". Once we have real
 * historical breadth we'll swap this out for a proper model, but the
 * output contract will stay the same so the frontend never notices.
 */
class ZoneScoreForecaster
{
    private const TRAIN_DAYS = 30;

    private const ALPHA = 0.4;   // level smoothing

    private const BETA = 0.15;   // trend smoothing

    public function __construct(private readonly int $maxHorizon = 30) {}

    /**
     * @return array{horizon: int, points: array<int, array{t: string, score: int, lower: int, upper: int}>}
     */
    public function forecast(string $zoneId, int $horizonDays): array
    {
        $horizonDays = max(1, min($this->maxHorizon, $horizonDays));

        $daily = $this->trainingSeries($zoneId);

        if ($daily === []) {
            // Nothing measured means nothing to project from. An empty series
            // is the honest answer; the alternative was a made-up midpoint
            // drawn with a confidence band around it.
            return ['horizon' => $horizonDays, 'points' => []];
        }

        if (count($daily) < 3) {
            // Not enough history to trend — carry the last real observation
            // forward, which is a naive forecast rather than an invention.
            return $this->flatline($daily, $horizonDays);
        }

        [$level, $trend, $residualStd] = $this->fitHolt($daily);
        $today = CarbonImmutable::now()->startOfDay();
        $points = [];

        for ($k = 1; $k <= $horizonDays; $k++) {
            $forecast = $level + $trend * $k;
            // Widen the band with horizon (std * sqrt(k)) — first day tight,
            // day 14 has meaningful uncertainty.
            $band = $residualStd * sqrt($k);
            $points[] = [
                't' => $today->addDays($k)->toDateString(),
                'score' => (int) round($this->clamp($forecast)),
                'lower' => (int) round($this->clamp($forecast - $band)),
                'upper' => (int) round($this->clamp($forecast + $band)),
            ];
        }

        return [
            'horizon' => $horizonDays,
            'points' => $points,
        ];
    }

    /**
     * @return array<int, float>
     */
    private function trainingSeries(string $zoneId): array
    {
        $rows = DB::table('zone_score_snapshots')
            ->where('zone_id', $zoneId)
            // A day whose snapshots were all unscoreable averages to null.
            // Casting that to 0.0 would drag the fitted trend toward a floor
            // the zone never touched, so those days train nothing.
            ->whereNotNull('score')
            ->where('captured_at', '>=', now()->subDays(self::TRAIN_DAYS))
            ->selectRaw("date_trunc('day', captured_at) as bucket")
            ->selectRaw('AVG(score) as score')
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->get();

        return $rows->map(fn ($r) => (float) $r->score)->all();
    }

    /**
     * @param  array<int, float>  $series
     * @return array{0: float, 1: float, 2: float} [level, trend, residualStd]
     */
    private function fitHolt(array $series): array
    {
        $level = $series[0];
        $trend = $series[1] - $series[0];
        $residuals = [];

        for ($i = 1; $i < count($series); $i++) {
            $prevLevel = $level;
            $level = self::ALPHA * $series[$i] + (1 - self::ALPHA) * ($prevLevel + $trend);
            $trend = self::BETA * ($level - $prevLevel) + (1 - self::BETA) * $trend;
            $residuals[] = $series[$i] - ($prevLevel + $trend);
        }

        return [$level, $trend, $this->stdev($residuals)];
    }

    /**
     * @param  array<int, float>  $values
     */
    private function stdev(array $values): float
    {
        if (count($values) < 2) {
            return 2.0;
        } // sensible minimum band
        $mean = array_sum($values) / count($values);
        $variance = 0.0;
        foreach ($values as $v) {
            $variance += ($v - $mean) ** 2;
        }

        return max(1.0, sqrt($variance / (count($values) - 1)));
    }

    /**
     * @param  non-empty-array<int, float>  $daily
     * @return array{horizon: int, points: array<int, array{t: string, score: int, lower: int, upper: int}>}
     */
    private function flatline(array $daily, int $horizonDays): array
    {
        // `?:` would have turned a genuine last reading of 0 into the old
        // hardcoded 50. The caller guarantees a non-empty series.
        $last = (float) end($daily);
        $today = CarbonImmutable::now()->startOfDay();
        $points = [];
        for ($k = 1; $k <= $horizonDays; $k++) {
            $points[] = [
                't' => $today->addDays($k)->toDateString(),
                'score' => (int) round($last),
                'lower' => (int) round(max(0, $last - 5)),
                'upper' => (int) round(min(100, $last + 5)),
            ];
        }

        return ['horizon' => $horizonDays, 'points' => $points];
    }

    private function clamp(float $v): float
    {
        return max(0.0, min(100.0, $v));
    }
}
