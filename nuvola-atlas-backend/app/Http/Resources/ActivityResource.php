<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'zoneId' => $this->zone_id,
            'kind' => $this->kind,
            'text' => $this->text,
            'source' => $this->source,
            'createdAt' => $this->created_at->toIso8601String(),
        ];
    }
}
