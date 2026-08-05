<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PortfolioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /**
         * @var array{
         *   firm: array<string,mixed>,
         *   composite: array{score: ?float, count: int, top: ?string, bottom: ?string},
         *   trend: list<array{captured_at: string, score: float}>,
         *   holdings: list<array{zone_id: string, zone_name: ?string, score: ?int, priority: int, thesis: ?string}>,
         * } $data
         */
        $data = $this->resource;
        return $data;
    }
}
