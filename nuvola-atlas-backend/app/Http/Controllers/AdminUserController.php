<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->with('partner:id,name')
            ->orderByDesc('created_at');

        if ($role = $request->string('role')->trim()->toString()) {
            $query->where('role', $role);
        }

        if ($q = $request->string('q')->trim()->toString()) {
            $query->where(function ($qb) use ($q) {
                $qb->where('name', 'ilike', "%{$q}%")
                    ->orWhere('email', 'ilike', "%{$q}%");
            });
        }

        $page = $query->paginate(20);

        return response()->json([
            'data' => collect($page->items())->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role()->value,
                'email_verified' => $u->hasVerifiedEmail(),
                'two_factor_enabled' => $u->hasTwoFactorEnabled(),
                'partner' => $u->partner ? [
                    'id' => $u->partner->id,
                    'name' => $u->partner->name,
                ] : null,
                'created_at' => $u->created_at?->toIso8601String(),
            ])->all(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
            ],
        ]);
    }
}
