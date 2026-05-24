<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'zoneId' => $this->zone_id,
            'date' => $this->date->format('Y-m-d'),
            'status' => $this->status,
            'author' => $this->author,
            'sizeBytes' => $this->size_bytes,
            'format' => $this->format,
        ];
    }
}
