<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

// Private channels — any authenticated user can listen
Broadcast::channel('zones.{zoneId}', function (User $user) {
    return true;
});

Broadcast::channel('alerts', function (User $user) {
    return true;
});
