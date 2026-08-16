<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ContentBlock;
use App\Services\Content\ContentBlockService;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminContentController extends Controller
{
    public function __construct(private ContentBlockService $service) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => ContentBlock::orderBy('key')->get()->map(fn (ContentBlock $b) => [
                'key' => $b->key,
                'body' => $b->body,
                'updated_at' => $b->updated_at?->toIso8601String(),
            ]),
        ]);
    }

    public function show(string $key): JsonResponse
    {
        $block = ContentBlock::findOrFail($key);

        return response()->json([
            'key' => $block->key,
            'body' => $block->body,
            'updated_at' => $block->updated_at?->toIso8601String(),
            'revisions' => $this->service->revisions($key)->map(fn ($r) => [
                'id' => $r->id,
                'body_snapshot' => $r->body_snapshot,
                'edited_at' => $r->edited_at?->toIso8601String(),
                'edited_by' => $r->edited_by,
            ]),
        ]);
    }

    public function save(Request $request, string $key): JsonResponse
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:200000'],
        ]);

        $block = $this->service->upsert($key, $data['body'], $request->user());

        Audit::record(action: 'admin.content.save', resource: $block);

        return response()->json([
            'key' => $block->key,
            'body' => $block->body,
            'updated_at' => $block->updated_at?->toIso8601String(),
        ]);
    }
}
