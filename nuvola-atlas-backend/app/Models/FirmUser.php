<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\FirmUserRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FirmUser extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'role_within_firm' => FirmUserRole::class,
        ];
    }

    public function firm(): BelongsTo
    {
        return $this->belongsTo(Firm::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
