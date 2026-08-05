<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreWatchlistEntryRequest;
use App\Http\Requests\UpdateWatchlistEntryRequest;
use App\Http\Resources\FirmWatchlistResource;
use App\Http\Resources\InvestorProfileResource;
use App\Models\FirmWatchlist;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Phase F — /investor/* endpoints. Sits behind `auth:sanctum` +
 * `firm.scope` middleware, so every action already has a firm to scope
 * to (Khillon's FirmScope guard rejects unaffiliated users with 403).
 *
 * Cross-firm leakage prevention lives inside every query — nothing here
 * ever reads or writes without a `firm_id = <caller's firm>` clause.
 */
class InvestorController extends Controller
{
    public function me(Request $request): InvestorProfileResource
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('primaryFirm');

        return new InvestorProfileResource($user);
    }

    public function watchlist(Request $request): JsonResponse
    {
        $firmId = $this->firmId($request);

        $entries = FirmWatchlist::query()
            ->with('zone')
            ->where('firm_id', $firmId)
            ->orderBy('priority')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'data' => FirmWatchlistResource::collection($entries)->resolve(),
        ]);
    }

    public function addToWatchlist(StoreWatchlistEntryRequest $request): JsonResponse
    {
        $firmId = $this->firmId($request);
        $data = $request->validated();

        $exists = FirmWatchlist::query()
            ->where('firm_id', $firmId)
            ->where('zone_id', $data['zone_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'type' => rtrim(config('app.url', ''), '/').'/problems/validation-error',
                'title' => 'Zone already on watchlist',
                'status' => 422,
                'detail' => 'This firm already tracks the requested zone.',
                'instance' => $request->path(),
            ], 422, ['Content-Type' => 'application/problem+json']);
        }

        $entry = FirmWatchlist::create([
            'firm_id' => $firmId,
            'zone_id' => $data['zone_id'],
            'priority' => $data['priority'] ?? 3,
            'thesis' => $data['thesis'] ?? null,
        ]);

        Audit::record(action: 'investor.watchlist.add', resource: $entry);

        return (new FirmWatchlistResource($entry->load('zone')))
            ->response()
            ->setStatusCode(201);
    }

    public function updateWatchlistEntry(UpdateWatchlistEntryRequest $request, string $id): FirmWatchlistResource
    {
        $firmId = $this->firmId($request);

        $entry = FirmWatchlist::query()
            ->where('firm_id', $firmId)
            ->where('id', $id)
            ->firstOrFail();

        $entry->update($request->validated());

        Audit::record(action: 'investor.watchlist.update', resource: $entry);

        return new FirmWatchlistResource($entry->load('zone'));
    }

    public function removeFromWatchlist(Request $request, string $id): JsonResponse
    {
        $firmId = $this->firmId($request);

        $entry = FirmWatchlist::query()
            ->where('firm_id', $firmId)
            ->where('id', $id)
            ->firstOrFail();

        $entry->delete();

        Audit::record(action: 'investor.watchlist.remove', resource: $entry);

        return response()->json(['message' => 'Removed from watchlist.']);
    }

    /**
     * Look up the caller's active firm. Admins operating on their own
     * account fall back to their `primary_firm_id`; support-context reads
     * of a specific firm go through the /admin/firms surface instead.
     */
    private function firmId(Request $request): string
    {
        /** @var User $user */
        $user = $request->user();
        $firmId = $user->primary_firm_id;

        if ($firmId === null) {
            abort(403, 'This route requires an assigned firm.');
        }

        return (string) $firmId;
    }
}
