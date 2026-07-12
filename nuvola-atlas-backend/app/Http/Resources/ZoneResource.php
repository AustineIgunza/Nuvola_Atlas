<?php

namespace App\Http\Resources;

use App\Services\ScoreCalculator;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ZoneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Pillars are derived from indicators on the fly — the storage swap
        // (pillars → 13 indicators) means the pillar columns no longer exist.
        // Deltas are still stubbed until a v2 snapshot-diff pipeline lands;
        // returning zeros keeps the wire format intact for the frontend.
        $calc = new ScoreCalculator();
        /** @var \App\Models\Zone $zone */
        $zone = $this->resource;
        $pillars = $calc->pillarScores($zone);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'score' => $this->score,
            'pillars' => [
                'social' => $pillars['social'],
                'safety' => $pillars['safety'],
                'density' => $pillars['density'],
                'infra' => $pillars['infra'],
            ],
            'deltas' => [
                'social' => 0,
                'safety' => 0,
                'density' => 0,
                'infra' => 0,
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
