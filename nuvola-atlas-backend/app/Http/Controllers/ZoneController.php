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
        $zones = Cache::remember("zones_page_{$page}", 60, fn () => Zone::withCentroid()->paginate(15));

        return ZoneResource::collection($zones);
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
