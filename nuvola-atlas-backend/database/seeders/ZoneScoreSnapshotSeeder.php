<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Scoring\ScoreCalculator;
use App\Models\Zone;
use App\Support\Pillars;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Backfills 30 days × hourly per-pillar snapshots so the ScoreHistoryChart and
 * forecast endpoint have data on a fresh clone. Uses a deterministic per-zone
 * PRNG so re-seeds produce the same series.
 *
 * Like ZoneSeeder, this is development fixture data — a random walk around the
 * seeded value, not a record of anything that happened. A pillar that is null
 * on the current zone row stays null across the whole series, so partial data
 * stays partial in the chart rather than appearing out of nowhere in history.
 */
class ZoneScoreSnapshotSeeder extends Seeder
{
    private const DAYS = 30;

    private const HOURS_PER_DAY = 24;

    public function run(ScoreCalculator $calculator): void
    {
        $zones = Zone::all();
        if ($zones->isEmpty()) {
            return;
        }

        $keys = Pillars::keys();
        $now = CarbonImmutable::now()->startOfHour();
        $rows = [];

        foreach ($zones as $zone) {
            mt_srand(crc32((string) $zone->id));

            $current = [];
            foreach ($keys as $key) {
                $current[$key] = $zone->getAttribute(Pillars::column($key));
            }

            for ($i = self::DAYS * self::HOURS_PER_DAY - 1; $i >= 0; $i--) {
                $capturedAt = $now->subHours($i);

                $columns = [];
                foreach ($keys as $key) {
                    if ($current[$key] === null) {
                        $columns[Pillars::column($key)] = null;
                    } else {
                        $current[$key] = $this->drift((int) $current[$key]);
                        $columns[Pillars::column($key)] = $current[$key];
                    }
                }

                // Reuse the production calculator so snapshot scores follow the
                // same null-exclusion rule as everything else.
                $tempZone = (new Zone)->forceFill($columns);

                $rows[] = array_merge(
                    [
                        'zone_id' => $zone->id,
                        'captured_at' => $capturedAt,
                        'score' => $calculator->calculateScore($tempZone),
                        'created_at' => $capturedAt,
                        'updated_at' => $capturedAt,
                    ],
                    $columns,
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
