<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Admin-only management of long-lived API keys for programmatic partner
 * access. Backed by Sanctum's PersonalAccessToken — the plaintext token is
 * returned exactly once at mint time and never persisted in any form an
 * admin can read back.
 *
 * Routes are mounted under /api/v1/admin/api-keys and guarded by
 * `role:admin` so non-admins can't list or revoke partner credentials.
 */
class AdminApiKeyController extends Controller
{
    /**
     * Abilities a partner key can carry. Add new entries here, never freeform
     * — abilities are evaluated against this list in middleware downstream.
     */
    public const ABILITIES = [
        'api:read',     // GET on /api/v1/zones, /projects, /alerts, /reports
        'api:write',    // POST /reports, POST /alerts/mark-all-read
    ];

    public function index(Request $request): JsonResponse
    {
        $tokens = PersonalAccessToken::query()
            ->whereJsonContains('abilities', 'api:read')
            ->orWhereJsonContains('abilities', 'api:write')
            ->with('tokenable:id,name,email,role,partner_id')
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        return response()->json([
            'data' => $tokens->map(fn (PersonalAccessToken $t) => $this->payload($t))->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'name' => ['required', 'string', 'max:120'],
            'abilities' => ['required', 'array', 'min:1'],
            'abilities.*' => ['string', Rule::in(self::ABILITIES)],
            'expires_in_days' => ['nullable', 'integer', 'min:1', 'max:730'],
            // Null = no per-key cap (still throttled by the default `api`
            // limiter at 60/min). Capped at 6000 so an admin can't disable
            // throttling by typing a five-digit number.
            'rate_limit_per_minute' => ['nullable', 'integer', 'min:1', 'max:6000'],
        ]);

        /** @var User $user */
        $user = User::findOrFail($validated['user_id']);

        $expiresAt = isset($validated['expires_in_days'])
            ? now()->addDays($validated['expires_in_days'])
            : null;

        $token = $user->createToken(
            name: $validated['name'],
            abilities: $validated['abilities'],
            expiresAt: $expiresAt,
        );

        // The cap lives on the PAT row directly; createToken doesn't expose
        // it, so we write it on the freshly-issued access token and save.
        if (array_key_exists('rate_limit_per_minute', $validated)) {
            $token->accessToken->forceFill([
                'rate_limit_per_minute' => $validated['rate_limit_per_minute'],
            ])->save();
        }

        Audit::record(
            action: 'api_key.created',
            resource: $token->accessToken,
            after: [
                'token_id' => $token->accessToken->id,
                'user_id' => $user->id,
                'name' => $validated['name'],
                'abilities' => $validated['abilities'],
                'expires_at' => $expiresAt?->toIso8601String(),
                'rate_limit_per_minute' => $validated['rate_limit_per_minute'] ?? null,
            ],
        );

        return response()->json([
            // The plaintext token. Returned once. Admin must copy it.
            'token' => $token->plainTextToken,
            'data' => $this->payload($token->accessToken->refresh()),
        ], 201);
    }

    public function destroy(int $id): JsonResponse
    {
        $token = PersonalAccessToken::find($id);
        if ($token === null) {
            throw new NotFoundHttpException('API key not found.');
        }

        $before = $this->payload($token);
        $token->delete();

        Audit::record(
            action: 'api_key.revoked',
            resource: $token,
            before: $before,
        );

        return response()->json(['message' => 'API key revoked.']);
    }

    private function payload(PersonalAccessToken $t): array
    {
        /** @var User|null $owner */
        $owner = $t->tokenable;

        return [
            'id' => $t->id,
            'name' => $t->name,
            'abilities' => $t->abilities,
            'rate_limit_per_minute' => $t->rate_limit_per_minute !== null
                ? (int) $t->rate_limit_per_minute
                : null,
            'last_used_at' => $t->last_used_at?->toIso8601String(),
            'expires_at' => $t->expires_at?->toIso8601String(),
            'created_at' => $t->created_at?->toIso8601String(),
            'user' => $owner ? [
                'id' => $owner->id,
                'name' => $owner->name,
                'email' => $owner->email,
                'role' => $owner->role()->value,
                'partner_id' => $owner->partner_id,
            ] : null,
        ];
    }
}
