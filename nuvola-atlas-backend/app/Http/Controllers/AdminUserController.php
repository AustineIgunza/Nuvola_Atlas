<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

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
                'two_factor_enabled' => $u->hasTwoFactorEnabled(),  // now sourced from email_two_factor_enabled_at
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

    /**
     * Role updates. Admins can promote/demote any user except themselves —
     * the self-lockout guard is here, not in middleware, because the same
     * admin can validly edit anyone else but accidentally removing their
     * own admin role would brick the account.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', Rule::in(array_column(Role::cases(), 'value'))],
        ]);

        /** @var User $actor */
        $actor = $request->user();
        $target = User::findOrFail($id);

        if ($actor->id === $target->id) {
            throw new AccessDeniedHttpException('Admins cannot change their own role.');
        }

        $before = ['role' => $target->role()->value];
        $target->role = Role::from($validated['role']);
        $target->save();

        Audit::record(
            action: 'user.role_changed',
            resource: $target,
            before: $before,
            after: ['role' => $target->role()->value],
        );

        return response()->json([
            'data' => [
                'id' => $target->id,
                'name' => $target->name,
                'email' => $target->email,
                'role' => $target->role()->value,
            ],
        ]);
    }
}
