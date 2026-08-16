<?php

declare(strict_types=1);

namespace App\Services\Impersonation;

use App\Models\ImpersonationSession;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Records who impersonated whom, when, and why. The actual session
 * swap lives in the controller (it needs the current request context);
 * this service owns the immutable session-log rows.
 */
class ImpersonationService
{
    public function start(User $admin, User $target, string $reason, Request $request): ImpersonationSession
    {
        return ImpersonationSession::create([
            'admin_user_id' => $admin->id,
            'target_user_id' => $target->id,
            'reason' => $reason,
            'ip' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 512),
            'started_at' => now(),
        ]);
    }

    public function end(ImpersonationSession $session): ImpersonationSession
    {
        $session->ended_at = now();
        $session->save();

        return $session->refresh();
    }
}
