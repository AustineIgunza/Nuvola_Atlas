<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\CountyContextResource;
use App\Services\CountyContext\CountyContextReadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CountyContextController extends Controller
{
    public function __construct(private readonly CountyContextReadService $reader) {}

    /**
     * GET /api/v1/county-context?county=Nairobi
     *
     * An unknown county returns an empty list, not 404: the county exists,
     * we just have no readings for it yet. That is what the banner needs
     * to render an "awaiting data" state honestly.
     */
    public function index(Request $request): JsonResponse
    {
        $county = (string) $request->query('county', 'Nairobi');

        $rows = $this->reader->forCounty($county);

        return response()->json([
            'data' => CountyContextResource::collection($rows),
        ]);
    }
}
