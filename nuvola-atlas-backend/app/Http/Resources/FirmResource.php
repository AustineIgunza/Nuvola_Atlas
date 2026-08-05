<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FirmResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var \App\Models\Firm $firm */
        $firm = $this->resource;

        return [
            'id' => $firm->id,
            'name' => $firm->name,
            'slug' => $firm->slug,
            'tier' => $firm->tier->value,
            'contact_email' => $firm->contact_email,
            'contact_name' => $firm->contact_name,
            'website' => $firm->website,
            'active' => $firm->active,
            'user_count' => $firm->users_count ?? $firm->users()->count(),
            'watchlist_count' => $firm->watchlists_count ?? $firm->watchlists()->count(),
            'created_at' => $firm->created_at?->toIso8601String(),
            'updated_at' => $firm->updated_at?->toIso8601String(),
        ];
    }
}
