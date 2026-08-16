<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AlertResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'severity' => $this->severity,
            'kind' => $this->kind,
            'title' => $this->title,
            'body' => $this->body,
            'zoneId' => $this->zone_id,
            'createdAt' => $this->created_at->toIso8601String(),
            'read' => $this->read,
        ];
    }
}
