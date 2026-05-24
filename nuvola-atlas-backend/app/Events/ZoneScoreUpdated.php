<?php

declare(strict_types=1);

namespace App\Events;

use App\Http\Resources\ZoneResource;
use App\Models\Zone;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ZoneScoreUpdated implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(public Zone $zone) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('zones.'.$this->zone->id),
        ];
    }

    public function broadcastWith(): array
    {
        return (new ZoneResource(
            $this->zone->loadMissing('layers')
        ))->resolve();
    }
}
