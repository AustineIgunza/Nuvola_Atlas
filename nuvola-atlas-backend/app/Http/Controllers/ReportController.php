<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreReportRequest;
use App\Http\Resources\ReportResource;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $query = Report::latest('date');

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('zone_id')) {
            $query->where('zone_id', $request->input('zone_id'));
        }

        return ReportResource::collection($query->paginate(15));
    }

    public function store(StoreReportRequest $request)
    {
        $validated = $request->validated();

        $report = Report::create([
            'id' => 'r'.Str::random(6),
            'title' => $validated['title'],
            'zone_id' => $validated['zoneId'] ?? null,
            'date' => now()->toDateString(),
            'status' => 'draft',
            'author' => 'System',
            'size_bytes' => 0,
            'format' => 'PDF',
        ]);

        return new ReportResource($report);
    }
}
