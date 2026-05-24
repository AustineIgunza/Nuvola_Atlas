<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ZoneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'score' => $this->score,
            'pillars' => [
                'social' => $this->pillar_social,
                'safety' => $this->pillar_safety,
                'density' => $this->pillar_density,
                'infra' => $this->pillar_infra,
            ],
            'deltas' => [
                'social' => $this->delta_social,
                'safety' => $this->delta_safety,
                'density' => $this->delta_density,
                'infra' => $this->delta_infra,
            ],
            'centroid' => [(float) $this->lon, (float) $this->lat],
            'lastSyncMin' => $this->last_sync_min,
            'layers' => $this->when($this->relationLoaded('layers'), function () {
                $grouped = $this->layers->keyBy('layer_type');

                return [
                    'roadProgress' => $grouped->get('road_progress')?->geojson,
                    'smartGrid' => $grouped->get('smart_grid')?->geojson,
                    'density' => $grouped->get('density')?->geojson,
                ];
            }),
            'boundary' => $this->when($this->boundary_geojson, fn () => json_decode($this->boundary_geojson)),
        ];
    }
}
