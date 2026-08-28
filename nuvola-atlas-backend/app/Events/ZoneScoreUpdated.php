<?php

declare(strict_types=1);

namespace App\Events;

use App\Domain\Scoring\PillarDeltaCalculator;
use App\Http\Resources\ZoneResource;
use App\Models\Zone;
use Illuminate\Broadcasting\PrivateChannel;
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
            new PrivateChannel('zones.'.$this->zone->id),
        ];
    }

    // Without this the wire name is the FQCN, which couples the JS listener
    // to the PHP namespace — moving the class would silently stop the feed.
    public function broadcastAs(): string
    {
        return 'ZoneScoreUpdated';
    }

    public function broadcastWith(): array
    {
        $zone = $this->zone->loadMissing('layers');
        $zone->pillarDelta = (new PillarDeltaCalculator)->forZones([$zone])[$zone->id] ?? null;

        return (new ZoneResource($zone))->resolve();
    }
}
