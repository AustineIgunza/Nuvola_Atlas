<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FirmWatchlistResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var \App\Models\FirmWatchlist $entry */
        $entry = $this->resource;
        $zone = $entry->zone;

        return [
            'id' => $entry->id,
            'firm_id' => $entry->firm_id,
            'zone' => $zone ? [
                'id' => $zone->id,
                'name' => $zone->name,
                'score' => $zone->score,
            ] : null,
            'priority' => $entry->priority,
            'thesis' => $entry->thesis,
            'added_at' => $entry->created_at?->toIso8601String(),
            'updated_at' => $entry->updated_at?->toIso8601String(),
        ];
    }
}
