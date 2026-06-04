<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

/**
 * Append-only audit log writer. Call from Observers, Controllers, or
 * anywhere a side-effect happens that should leave a forensic trail.
 *
 * Failures here are swallowed — auditing must never break the request.
 * If you need stricter guarantees (e.g. tamper-evident chain), wire this
 * to a Pulse/Sentry capture in addition.
 */
class Audit
{
    public static function record(
        string $action,
        ?Model $resource = null,
        ?array $before = null,
        ?array $after = null,
    ): void {
        try {
            $request = app()->bound('request') ? Request::instance() : null;

            AuditLog::create([
                'actor_id' => Auth::id(),
                'action' => $action,
                'resource_type' => $resource ? class_basename($resource) : null,
                'resource_id' => $resource?->getKey() !== null ? (string) $resource->getKey() : null,
                'before' => $before,
                'after' => $after,
                'ip' => $request?->ip(),
                'user_agent' => $request ? substr((string) $request->userAgent(), 0, 512) : null,
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
