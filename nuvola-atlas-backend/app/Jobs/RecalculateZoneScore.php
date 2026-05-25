<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Zone;
use App\Services\ScoreCalculator;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RecalculateZoneScore implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 10;

    public function __construct(public string $zoneId) {}

    public function handle(ScoreCalculator $calculator): void
    {
        $zone = Zone::find($this->zoneId);

        if ($zone) {
            $calculator->recalculate($zone, broadcast: true);
        }
    }
}
