<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ZoneLayerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'layerType' => $this->layer_type,
            'geojson' => $this->geojson,
        ];
    }
}
