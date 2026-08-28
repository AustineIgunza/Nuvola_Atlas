<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Domain\Scoring\PillarDeltaCalculator;
use App\Enums\Role;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\ZoneLayerResource;
use App\Http\Resources\ZoneResource;
use App\Models\Activity;
use App\Models\Zone;
use App\Support\DataProvenance;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ZoneController extends Controller
{
    public function index()
    {
        // Cache key is per-role — admin/editor sees fixture zones with the
        // flag attached; anyone else only sees measured ones. Two caches
        // avoid a viewer receiving an admin-cached payload with demo data
        // in it. See DataProvenance for the gate rationale (R2 §P7.3).
        $canSeeDemoData = $this->canSeeDemoData();
        $page = request()->input('page', 1);
        $bucket = $canSeeDemoData ? 'privileged' : 'public';

        return Cache::remember(
            "zones_page_{$bucket}_{$page}",
            60,
            function () use ($canSeeDemoData) {
                $query = Zone::withCentroid();
                if (! $canSeeDemoData) {
                    // Public listing is publishable-only. A viewer who lands
                    // on the app during the seeded-data phase sees an empty
                    // set, which is honest — better than a set full of
                    // invented scores.
                    $query->where('data_provenance', DataProvenance::MEASURED);
                }
                $zones = $query->paginate(15);
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

        // The single-zone route respects the same gate. A viewer asking
        // for a fixture zone by id gets a 404, not a demo score — 403
        // would confirm the zone exists, and even that leaks the fixture
        // set to a public caller.
        if (
            ! $this->canSeeDemoData()
            && DataProvenance::isDemo($zone->getAttribute('data_provenance'))
        ) {
            throw new NotFoundHttpException;
        }

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

    /**
     * Admins and editors see the full set (including fixture / mixed
     * zones) with the flag attached. Everyone else — including
     * anonymous callers on public routes — sees measured-only.
     */
    private function canSeeDemoData(): bool
    {
        $user = request()->user();
        if ($user === null) {
            return false;
        }

        return in_array($user->role(), [Role::Admin, Role::Editor], true);
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
