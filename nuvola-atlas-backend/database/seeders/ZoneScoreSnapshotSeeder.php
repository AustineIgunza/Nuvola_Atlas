<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Zone;
use App\Services\ScoreCalculator;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

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

        $weights = $calculator->getWeights();
        $now = CarbonImmutable::now()->startOfHour();
        $rows = [];

        foreach ($zones as $zone) {
            // Deterministic per-zone series so a re-seed produces the same shape.
            mt_srand(crc32((string) $zone->id));

            $social = (int) $zone->pillar_social;
            $safety = (int) $zone->pillar_safety;
            $density = (int) $zone->pillar_density;
            $infra = (int) $zone->pillar_infra;

            for ($i = self::DAYS * self::HOURS_PER_DAY - 1; $i >= 0; $i--) {
                $capturedAt = $now->subHours($i);

                $social = $this->drift($social);
                $safety = $this->drift($safety);
                $density = $this->drift($density);
                $infra = $this->drift($infra);

                $score = (int) round(
                    $social * ($weights['social'] ?? 0.25)
                    + $safety * ($weights['safety'] ?? 0.25)
                    + $density * ($weights['density'] ?? 0.25)
                    + $infra * ($weights['infra'] ?? 0.25)
                );

                $rows[] = [
                    'zone_id' => $zone->id,
                    'captured_at' => $capturedAt,
                    'score' => $score,
                    'pillar_social' => $social,
                    'pillar_safety' => $safety,
                    'pillar_density' => $density,
                    'pillar_infra' => $infra,
                    'created_at' => $capturedAt,
                    'updated_at' => $capturedAt,
                ];
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
