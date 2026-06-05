<?php

namespace App\Models;

use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => Role::class,
        ];
    }

    public function role(): Role
    {
        return $this->role ?? Role::Viewer;
    }

    public function hasRole(Role $role): bool
    {
        return $this->role() === $role;
    }

    public function hasRoleAtLeast(Role $role): bool
    {
        return $this->role()->isAtLeast($role);
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function hasTwoFactorEnabled(): bool
    {
        return $this->email_two_factor_enabled_at !== null;
    }

    /**
     * Returns the user's email with the local-part masked except the first
     * two characters, e.g. `au***@nuvola.dev`. Used in sign-in responses so
     * the UI can hint where the code was sent without disclosing the full
     * address to anyone who got hold of the credentials.
     */
    public function maskedEmail(): string
    {
        $email = $this->email ?? '';
        $at = strpos($email, '@');
        if ($at === false) return $email;
        $local = substr($email, 0, $at);
        $domain = substr($email, $at);
        if (strlen($local) <= 2) return $local.'***'.$domain;
        return substr($local, 0, 2).str_repeat('*', max(3, strlen($local) - 2)).$domain;
    }
}
