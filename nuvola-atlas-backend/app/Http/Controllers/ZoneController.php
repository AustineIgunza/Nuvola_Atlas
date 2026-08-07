<?php

namespace App\Http\Controllers;

use App\Http\Resources\ActivityResource;
use App\Http\Resources\ZoneLayerResource;
use App\Http\Resources\ZoneResource;
use App\Models\Activity;
use App\Models\Zone;
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
            fn () => ZoneResource::collection(Zone::withCentroid()->paginate(15))
                ->response()
                ->getData(true),
        );
    }

    public function show(string $id)
    {
        return new ZoneResource(
            Zone::withCentroid()
                ->withBoundary()
                ->with('layers')
                ->findOrFail($id)
        );
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
