<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\VitalityHistory;
use App\Models\Zone;
use Illuminate\Console\Command;

class SyncVitalityHistory extends Command
{
    protected $signature = 'atlas:sync-history';

    protected $description = 'Append a monthly average vitality score to the history table';

    public function handle(): int
    {
        // AVG already skips unscoreable zones, so the monthly figure covers
        // the zones that were measured rather than being dragged toward a
        // floor by the ones that were not.
        $avg = Zone::avg('score');

        if ($avg === null) {
            $this->error('No scoreable zones — every zone is either absent or has no indicators yet.');

            return self::FAILURE;
        }

        $month = now()->format("M 'y");

        VitalityHistory::create([
            'month' => $month,
            'overall_avg' => round($avg, 1),
        ]);

        $this->info("Recorded history: {$month} → ".round($avg, 1));

        return self::SUCCESS;
    }
}
