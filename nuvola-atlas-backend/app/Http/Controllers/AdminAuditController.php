<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAuditController extends Controller
{
    /**
     * Paginated audit log feed for the admin dashboard.
     *
     * Cursor-paginated (15/page) to match the pattern used by
     * /api/v1/alerts and /api/v1/zones/{id}/activity. Supports an optional
     * `?action=` filter for drilling into a specific event class.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::query()
            ->with('actor:id,name,email,role')
            ->latest('id');

        if ($action = $request->string('action')->trim()->toString()) {
            $query->where('action', $action);
        }

        if ($actorId = $request->integer('actor_id')) {
            $query->where('actor_id', $actorId);
        }

        $page = $query->cursorPaginate(15);

        return response()->json([
            'data' => collect($page->items())->map(fn (AuditLog $row) => [
                'id' => $row->id,
                'action' => $row->action,
                'resource_type' => $row->resource_type,
                'resource_id' => $row->resource_id,
                'before' => $row->before,
                'after' => $row->after,
                'ip' => $row->ip,
                'user_agent' => $row->user_agent,
                'created_at' => $row->created_at?->toIso8601String(),
                'actor' => $row->actor ? [
                    'id' => $row->actor->id,
                    'name' => $row->actor->name,
                    'email' => $row->actor->email,
                    'role' => $row->actor->role()->value,
                ] : null,
            ])->all(),
            'meta' => [
                'next_cursor' => $page->nextCursor()?->encode(),
                'prev_cursor' => $page->previousCursor()?->encode(),
                'per_page' => $page->perPage(),
            ],
        ]);
    }
}
