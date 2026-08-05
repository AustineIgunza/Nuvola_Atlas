<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Zone;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Bulk recalculation entry point. Dispatched by the Phase E
 * MethodologyPublisher when a new weights version is promoted, and by the
 * Artisan `atlas:recalculate-scores` command when run without a `--zone`
 * option.
 *
 * Fans zones out to RecalculateZoneScore in fixed chunks so a rebuild of
 * all 17 sub-counties never fires 17 broadcasts back-to-back through Reverb
 * — the chunked queue push spreads the load across worker capacity.
 */
class RecalculateAllZones implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 30;

    public const CHUNK_SIZE = 5;

    public function __construct(public bool $broadcast = true) {}

    public function handle(): int
    {
        $dispatched = 0;

        Zone::query()
            ->select('id')
            ->orderBy('id')
            ->chunk(self::CHUNK_SIZE, function ($zones) use (&$dispatched) {
                foreach ($zones as $zone) {
                    RecalculateZoneScore::dispatch($zone->id, $this->broadcast);
                    $dispatched++;
                }
            });

        return $dispatched;
    }
}
