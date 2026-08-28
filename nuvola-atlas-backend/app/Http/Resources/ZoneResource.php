<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Scoring\PillarDeltaCalculator;
use App\Domain\Scoring\ScoreCalculator;
use App\Models\Zone;
use App\Support\Pillars;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use RuntimeException;

class ZoneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $calc = new ScoreCalculator;
        /** @var Zone $zone */
        $zone = $this->resource;
        $pillars = $calc->pillarScores($zone);
        $missing = $calc->missingPillars($zone);
        $delta = $zone->pillarDelta ?? PillarDeltaCalculator::unknown();

        self::assertNoRetiredPillars($pillars);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'score' => $this->score,
            'pillars' => $pillars,
            'deltas' => $delta['deltas'],
            'deltaWindowDays' => $delta['windowDays'],
            'missingPillars' => $missing,
            'pillarsMeasured' => count($pillars) - count($missing),
            'pillarsTotal' => count($pillars),
            'pillarRegistryVersion' => Pillars::version(),
            // The fixture gate — R2 §P7.3. Every response carries the flag
            // so the frontend cannot render a demo number as measurement.
            // Provenance travels alongside the score, not derived from it,
            // because a null score is not automatically fixture-free.
            'dataProvenance' => $calc->dataProvenance($zone),
            'centroid' => [(float) $this->lon, (float) $this->lat],
            'lastSyncMin' => $this->last_sync_min,
            'layers' => $this->when($this->relationLoaded('layers'), function () {
                $grouped = $this->layers->keyBy('layer_type');

                return [
                    'roadDensity' => $grouped->get('road_density')?->geojson,
                    'electricityAccess' => $grouped->get('electricity_access')?->geojson,
                    'density' => $grouped->get('density')?->geojson,
                ];
            }),
            'boundary' => $this->when($this->boundary_geojson, fn () => json_decode($this->boundary_geojson)),
        ];
    }

    /**
     * A pillar that was switched off must not reach a client under any
     * circumstance — a stale cache entry or a hand-written array is enough to
     * leak one back into a response, and a retired pillar on screen is a
     * number nobody is standing behind.
     *
     * @param  array<string, mixed>  $pillars
     */
    private static function assertNoRetiredPillars(array $pillars): void
    {
        $retired = array_intersect(array_keys($pillars), Pillars::retiredKeys());
        if ($retired !== []) {
            throw new RuntimeException(
                'Retired pillar(s) in zone payload: '.implode(', ', $retired)
            );
        }
    }
}
