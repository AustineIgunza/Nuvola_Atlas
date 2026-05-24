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
        $avg = Zone::avg('score');

        if ($avg === null) {
            $this->error('No zones found to compute average.');

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
