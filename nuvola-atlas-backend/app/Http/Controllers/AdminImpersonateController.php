<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ImpersonationSession;
use App\Models\User;
use App\Services\Impersonation\ImpersonationService;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminImpersonateController extends Controller
{
    public function __construct(private ImpersonationService $service) {}

    public function start(Request $request): JsonResponse
    {
        $data = $request->validate([
            'target_user_id' => ['required', 'integer', 'exists:users,id'],
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        $target = User::findOrFail($data['target_user_id']);
        $admin = $request->user();

        if ($target->id === $admin->id) {
            abort(422, 'You cannot impersonate yourself.');
        }

        $session = $this->service->start($admin, $target, $data['reason'], $request);
        $sanctumToken = $target->createToken('impersonation:'.$session->id)->plainTextToken;

        Audit::record(action: 'admin.impersonate.start', resource: $session);

        return response()->json([
            'session_id' => $session->id,
            'target' => [
                'id' => $target->id,
                'name' => $target->name,
                'email' => $target->email,
                'role' => $target->role()->value,
            ],
            'token' => $sanctumToken,
        ], 201);
    }

    public function stop(string $id): JsonResponse
    {
        $session = ImpersonationSession::findOrFail($id);
        $this->service->end($session);

        Audit::record(action: 'admin.impersonate.stop', resource: $session);

        return response()->json(['message' => 'Impersonation session ended.']);
    }

    public function index(Request $request): JsonResponse
    {
        $rows = ImpersonationSession::with(['admin:id,name,email', 'target:id,name,email'])
            ->orderByDesc('started_at')
            ->limit(100)
            ->get()
            ->map(fn (ImpersonationSession $s) => [
                'id' => $s->id,
                'admin' => $s->admin ? ['id' => $s->admin->id, 'name' => $s->admin->name] : null,
                'target' => $s->target ? ['id' => $s->target->id, 'name' => $s->target->name] : null,
                'reason' => $s->reason,
                'ip' => $s->ip,
                'started_at' => $s->started_at?->toIso8601String(),
                'ended_at' => $s->ended_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $rows]);
    }
}
