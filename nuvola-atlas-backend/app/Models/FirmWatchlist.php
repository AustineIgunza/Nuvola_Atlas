<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FirmWatchlist extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'priority' => 'int',
        ];
    }

    public function firm(): BelongsTo
    {
        return $this->belongsTo(Firm::class);
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }
}
