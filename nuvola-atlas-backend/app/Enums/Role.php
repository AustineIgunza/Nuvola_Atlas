<?php

declare(strict_types=1);

namespace App\Enums;

enum Role: string
{
    case Viewer = 'viewer';
    case Partner = 'partner';
    case Editor = 'editor';
    case Admin = 'admin';

    /**
     * Roles that grant write access to internal resources (reports, alerts).
     * Viewer is read-only; Partner gets zone-scoped writes elsewhere.
     */
    public function canEditInternal(): bool
    {
        return match ($this) {
            self::Editor, self::Admin => true,
            default => false,
        };
    }

    public function canManageUsers(): bool
    {
        return $this === self::Admin;
    }

    /** Numeric ranking — useful for `>=` style checks in middleware. */
    public function rank(): int
    {
        return match ($this) {
            self::Viewer => 1,
            self::Partner => 2,
            self::Editor => 3,
            self::Admin => 4,
        };
    }

    public function isAtLeast(self $other): bool
    {
        return $this->rank() >= $other->rank();
    }
}
