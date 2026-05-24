<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Events\ZoneScoreUpdated;
use App\Models\Zone;
use Illuminate\Console\Command;

class RecalculateScores extends Command
{
    protected $signature = 'atlas:recalculate-scores
                            {--zone= : Recalculate for a specific zone ID}
                            {--broadcast : Fire broadcast events after recalculation}';

    protected $description = 'Recalculate zone vitality scores from pillar values';

    public function handle(): int
    {
        $zoneId = $this->option('zone');
        $broadcast = $this->option('broadcast');

        $query = Zone::query();

        if ($zoneId) {
            $query->where('id', $zoneId);
        }

        $zones = $query->get();

        if ($zones->isEmpty()) {
            $this->error('No zones found.');

            return self::FAILURE;
        }

        $updated = 0;

        foreach ($zones as $zone) {
            $score = (int) round(
                ($zone->pillar_social + $zone->pillar_safety + $zone->pillar_density + $zone->pillar_infra) / 4
            );

            $zone->update(['score' => $score]);
            $updated++;

            if ($broadcast) {
                ZoneScoreUpdated::dispatch($zone);
            }
        }

        $this->info("Recalculated scores for {$updated} zone(s).");

        return self::SUCCESS;
    }
}
