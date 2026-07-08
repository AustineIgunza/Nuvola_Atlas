<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ZoneScoreSnapshot extends Model
{
    protected $fillable = [
        'zone_id',
        'captured_at',
        'score',
        'pillar_social',
        'pillar_safety',
        'pillar_density',
        'pillar_infra',
    ];

    protected $casts = [
        'captured_at' => 'immutable_datetime',
    ];

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }
}
