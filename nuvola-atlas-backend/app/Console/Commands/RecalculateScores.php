<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Zone;
use App\Services\ScoreCalculator;
use Illuminate\Console\Command;

class RecalculateScores extends Command
{
    protected $signature = 'atlas:recalculate-scores
                            {--zone= : Recalculate for a specific zone ID}
                            {--broadcast : Fire broadcast events after recalculation}';

    protected $description = 'Recalculate zone vitality scores using methodology-weighted pillars';

    public function handle(ScoreCalculator $calculator): int
    {
        $zoneId = $this->option('zone');
        $broadcast = (bool) $this->option('broadcast');

        if ($zoneId) {
            $zone = Zone::find($zoneId);

            if (! $zone) {
                $this->error("Zone '{$zoneId}' not found.");

                return self::FAILURE;
            }

            $calculator->recalculate($zone, $broadcast);
            $this->info("Recalculated score for {$zone->name}: {$zone->score}");

            return self::SUCCESS;
        }

        $count = $calculator->recalculateAll($broadcast);
        $this->info("Recalculated scores for {$count} zone(s).");

        $weights = $calculator->getWeights();
        $this->table(
            ['Pillar', 'Weight'],
            collect($weights)->map(fn ($w, $k) => [$k, round($w * 100, 1).'%'])->values()->toArray()
        );

        return self::SUCCESS;
    }
}
