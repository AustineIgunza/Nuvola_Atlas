<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\MethodologyVersion;
use App\Services\Methodology\MethodologyPublisher;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminMethodologyController extends Controller
{
    public function __construct(private MethodologyPublisher $publisher) {}

    public function index(): JsonResponse
    {
        $rows = MethodologyVersion::orderByDesc('is_current')
            ->orderByDesc('published_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (MethodologyVersion $v) => [
                'id' => $v->id,
                'version' => $v->version,
                'weights' => $v->weights,
                'bands' => $v->bands,
                'is_current' => $v->is_current,
                'draft' => $v->draft,
                'changelog' => $v->changelog,
                'published_at' => $v->published_at?->toIso8601String(),
                'published_by' => $v->published_by,
            ]);

        return response()->json(['data' => $rows]);
    }

    public function publish(Request $request, string $id): JsonResponse
    {
        $version = MethodologyVersion::findOrFail($id);
        $updated = $this->publisher->publish($version, $request->user());

        Audit::record(action: 'admin.methodology.publish', resource: $updated);

        return response()->json([
            'id' => $updated->id,
            'version' => $updated->version,
            'is_current' => $updated->is_current,
            'published_at' => $updated->published_at?->toIso8601String(),
        ]);
    }

    public function preview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'weights.social' => ['required', 'numeric', 'between:0,1'],
            'weights.safety' => ['required', 'numeric', 'between:0,1'],
            'weights.density' => ['required', 'numeric', 'between:0,1'],
            'weights.infra' => ['required', 'numeric', 'between:0,1'],
        ]);

        $preview = $this->publisher->previewImpact($validated['weights']);

        return response()->json([
            'weights' => $validated['weights'],
            'impact' => $preview->compute(),
        ]);
    }
}
