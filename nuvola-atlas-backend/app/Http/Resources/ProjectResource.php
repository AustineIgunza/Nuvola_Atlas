<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'zoneId' => $this->zone_id,
            'agency' => $this->agency,
            'type' => $this->type,
            'status' => $this->status,
            'progress' => $this->progress,
            'budget' => $this->budget,
            'started' => $this->started->format('Y-m-d'),
            'eta' => $this->eta->format('Y-m-d'),
            'milestones' => $this->milestones,
            'marker' => [(float) $this->marker_lon, (float) $this->marker_lat],
        ];
    }
}
