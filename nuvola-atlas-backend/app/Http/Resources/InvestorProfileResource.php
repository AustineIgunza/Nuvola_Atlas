<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvestorProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var User $user */
        $user = $this->resource;
        $firm = $user->primaryFirm;

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role()->value,
            ],
            'firm' => $firm ? [
                'id' => $firm->id,
                'slug' => $firm->slug,
                'name' => $firm->name,
                'tier' => $firm->tier->value,
                'active' => $firm->active,
            ] : null,
            'tier' => $firm?->tier->value,
            'watchlist_count' => $firm?->watchlists()->count() ?? 0,
        ];
    }
}
