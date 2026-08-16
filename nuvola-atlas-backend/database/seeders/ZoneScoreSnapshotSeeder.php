<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Zone;
use App\Services\ScoreCalculator;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Backfills 30 days × hourly per-indicator snapshots so the ScoreHistoryChart
 * and forecast endpoint have data on a fresh clone. Uses a deterministic
 * per-zone PRNG so re-seeds produce the same series.
 *
 * Indicators that are null on the current zone row stay null across the
 * snapshot series — a missing indicator does not suddenly appear in the
 * historical data.
 */
class ZoneScoreSnapshotSeeder extends Seeder
{
    private const DAYS = 30;

    private const HOURS_PER_DAY = 24;

    /** @return array<int, string> */
    private function indicatorSlugs(): array
    {
        $out = [];
        foreach (ScoreCalculator::pillars() as $slugs) {
            foreach ($slugs as $slug) {
                $out[] = $slug;
            }
        }

        return $out;
    }

    public function run(ScoreCalculator $calculator): void
    {
        $zones = Zone::all();
        if ($zones->isEmpty()) {
            return;
        }

        $slugs = $this->indicatorSlugs();
        $now = CarbonImmutable::now()->startOfHour();
        $rows = [];

        foreach ($zones as $zone) {
            mt_srand(crc32((string) $zone->id));

            // Seed each indicator's current value; nulls remain null across
            // the whole series so partial data stays partial in the chart.
            $current = [];
            foreach ($slugs as $slug) {
                $current[$slug] = $zone->getAttribute('indicator_'.$slug);
            }

            for ($i = self::DAYS * self::HOURS_PER_DAY - 1; $i >= 0; $i--) {
                $capturedAt = $now->subHours($i);

                $rowIndicators = [];
                foreach ($slugs as $slug) {
                    if ($current[$slug] === null) {
                        $rowIndicators['indicator_'.$slug] = null;
                    } else {
                        $current[$slug] = $this->drift((int) $current[$slug]);
                        $rowIndicators['indicator_'.$slug] = $current[$slug];
                    }
                }

                // Reuse the production calculator so snapshot scores match
                // the "average non-null indicators" rule.
                $tempZone = (new Zone)->forceFill($rowIndicators);
                $score = $calculator->calculateScore($tempZone) ?? 0;

                $rows[] = array_merge(
                    [
                        'zone_id' => $zone->id,
                        'captured_at' => $capturedAt,
                        'score' => $score,
                        'created_at' => $capturedAt,
                        'updated_at' => $capturedAt,
                    ],
                    $rowIndicators,
                );
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('zone_score_snapshots')->insert($chunk);
        }
    }

    private function drift(int $value): int
    {
        $delta = mt_rand(-2, 2);

        return max(0, min(100, $value + $delta));
    }
}
