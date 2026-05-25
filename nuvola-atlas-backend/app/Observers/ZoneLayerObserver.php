<?php

declare(strict_types=1);

namespace App\Observers;

use App\Jobs\RecalculateZoneScore;
use App\Models\ZoneLayer;

class ZoneLayerObserver
{
    public function created(ZoneLayer $layer): void
    {
        RecalculateZoneScore::dispatch($layer->zone_id);
    }

    public function updated(ZoneLayer $layer): void
    {
        RecalculateZoneScore::dispatch($layer->zone_id);
    }
}
