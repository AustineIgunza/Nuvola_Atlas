<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Broadcast;

// Public channels — no authentication required for zone updates
Broadcast::channel('zones.{zoneId}', function () {
    return true;
});

Broadcast::channel('alerts', function () {
    return true;
});
