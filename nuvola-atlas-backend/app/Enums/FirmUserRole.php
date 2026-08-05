<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Intra-firm role. Distinct from the platform-wide `users.role` — a user
 * may be an `admin` on the platform but a `viewer` inside a specific firm,
 * or vice versa. The `firm.scope` middleware enforces intra-firm authority
 * on `/investor/*` write paths.
 */
enum FirmUserRole: string
{
    case Viewer = 'viewer';
    case Analyst = 'analyst';
    case Admin = 'admin';

    public function canWriteWatchlist(): bool
    {
        return match ($this) {
            self::Analyst, self::Admin => true,
            self::Viewer => false,
        };
    }

    public function canPublishBrief(): bool
    {
        return $this === self::Admin;
    }
}
