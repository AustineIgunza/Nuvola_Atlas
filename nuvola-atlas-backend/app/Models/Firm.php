<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\FirmTier;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Firm extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'tier' => FirmTier::class,
            'active' => 'boolean',
        ];
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'firm_users')
            ->withPivot(['role_within_firm'])
            ->withTimestamps();
    }

    public function watchlists(): HasMany
    {
        return $this->hasMany(FirmWatchlist::class);
    }

    public function primaryUsers(): HasMany
    {
        return $this->hasMany(User::class, 'primary_firm_id');
    }
}
