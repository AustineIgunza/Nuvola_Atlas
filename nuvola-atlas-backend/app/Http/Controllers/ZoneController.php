<?php

namespace App\Http\Controllers;

use App\Http\Resources\ActivityResource;
use App\Http\Resources\ZoneLayerResource;
use App\Http\Resources\ZoneResource;
use App\Models\Activity;
use App\Models\Zone;

class ZoneController extends Controller
{
    public function index()
    {
        return ZoneResource::collection(Zone::withCentroid()->get());
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
            Activity::where('zone_id', $id)->latest()->get()
        );
    }

    public function layers(string $id)
    {
        $zone = Zone::findOrFail($id);

        return ZoneLayerResource::collection($zone->layers);
    }
}
