<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReportRequest;
use App\Http\Resources\ReportResource;
use App\Models\Report;
use Illuminate\Support\Str;

class ReportController extends Controller
{
    public function index()
    {
        return ReportResource::collection(Report::latest('date')->get());
    }

    public function store(StoreReportRequest $request)
    {
        $validated = $request->validated();

        $report = Report::create([
            'id' => 'r' . Str::random(6),
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
