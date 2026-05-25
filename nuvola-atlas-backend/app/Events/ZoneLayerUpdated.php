<?php

declare(strict_types=1);

namespace App\Events;

use App\Http\Resources\ZoneLayerResource;
use App\Models\ZoneLayer;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ZoneLayerUpdated implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(public ZoneLayer $layer) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('zones.'.$this->layer->zone_id),
        ];
    }

    public function broadcastWith(): array
    {
        return (new ZoneLayerResource($this->layer))->resolve();
    }
}
