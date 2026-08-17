<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\ActivityResource;
use App\Http\Resources\ZoneLayerResource;
use App\Http\Resources\ZoneResource;
use App\Models\Activity;
use App\Models\Zone;
use App\Services\PillarDeltaCalculator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class ZoneController extends Controller
{
    public function index()
    {
        $page = request()->input('page', 1);

        // Cache the rendered payload rather than the paginator. Any store
        // that serializes (file, database, redis) fails to rehydrate the
        // paginator's model graph on read; the array store used in tests
        // hands the object straight back, so this only breaks off-test.
        return Cache::remember(
            "zones_page_{$page}",
            60,
            function () {
                $zones = Zone::withCentroid()->paginate(15);
                $this->attachDeltas($zones->getCollection());

                return ZoneResource::collection($zones)->response()->getData(true);
            },
        );
    }

    public function show(string $id)
    {
        $zone = Zone::withCentroid()
            ->withBoundary()
            ->with('layers')
            ->findOrFail($id);

        $this->attachDeltas(collect([$zone]));

        return new ZoneResource($zone);
    }

    /**
     * Attach batch-loaded pillar deltas so ZoneResource reports real
     * movement instead of "unknown". Two queries for the whole page.
     *
     * @param  Collection<int, Zone>  $zones
     */
    private function attachDeltas($zones): void
    {
        $deltas = (new PillarDeltaCalculator)->forZones($zones);
        foreach ($zones as $zone) {
            $zone->pillarDelta = $deltas[$zone->id] ?? null;
        }
    }

    public function activity(string $id)
    {
        Zone::findOrFail($id);

        return ActivityResource::collection(
            Activity::where('zone_id', $id)->latest()->cursorPaginate(20)
        );
    }

    public function layers(string $id)
    {
        $zone = Zone::findOrFail($id);

        return ZoneLayerResource::collection($zone->layers);
    }
}
