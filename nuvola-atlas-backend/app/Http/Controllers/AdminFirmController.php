<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreFirmRequest;
use App\Http\Requests\UpdateFirmRequest;
use App\Http\Resources\FirmResource;
use App\Models\Firm;
use App\Services\Firms\FirmService;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminFirmController extends Controller
{
    public function __construct(private FirmService $firms) {}

    public function index(Request $request): JsonResponse
    {
        $q = $request->query('q');
        $tier = $request->query('tier');

        $query = Firm::query()->withCount(['users', 'watchlists']);
        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'ilike', "%{$q}%")
                    ->orWhere('slug', 'ilike', "%{$q}%")
                    ->orWhere('contact_email', 'ilike', "%{$q}%");
            });
        }
        if ($tier) {
            $query->where('tier', $tier);
        }

        return response()->json([
            'data' => FirmResource::collection($query->orderBy('name')->paginate(25))->resolve(),
        ]);
    }

    public function show(string $id): FirmResource
    {
        $firm = Firm::withCount(['users', 'watchlists'])->findOrFail($id);

        return new FirmResource($firm);
    }

    public function store(StoreFirmRequest $request): JsonResponse
    {
        $firm = $this->firms->create($request->validated());
        Audit::record(action: 'admin.firm.create', resource: $firm);

        return (new FirmResource($firm))->response()->setStatusCode(201);
    }

    public function update(UpdateFirmRequest $request, string $id): FirmResource
    {
        $firm = Firm::findOrFail($id);
        $this->firms->update($firm, $request->validated());
        Audit::record(action: 'admin.firm.update', resource: $firm);

        return new FirmResource($firm);
    }

    public function destroy(string $id): JsonResponse
    {
        $firm = Firm::findOrFail($id);
        $this->firms->deactivate($firm);
        Audit::record(action: 'admin.firm.deactivate', resource: $firm);

        return response()->json(['message' => 'Firm deactivated.']);
    }
}
