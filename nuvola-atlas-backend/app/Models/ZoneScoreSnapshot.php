<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ZoneScoreSnapshot extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'captured_at' => 'immutable_datetime',
    ];

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    /**
     * The methodology version this snapshot was computed under. Nullable
     * for rows written before the P8 binding — those were backfilled
     * with the current version at migration time, but a genuinely
     * unversioned row (e.g. an old fixture) still reads null.
     */
    public function methodologyVersion(): BelongsTo
    {
        return $this->belongsTo(MethodologyVersion::class);
    }
}
