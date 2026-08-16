<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class DataIngestionLog extends Model
{
    /**
     * `source` prefix stamped by nuvola:ingest-smoke. Synthetic batches are
     * real rows — they went through the real pipeline — but they must never
     * count as evidence that a live feed is delivering, or a smoke run would
     * make /api/health/ingestion look green while Daystar sat silent.
     */
    public const SMOKE_SOURCE_PREFIX = 'smoke:';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'accepted' => 'boolean',
            'error_reasons' => 'array',
            'verified_by_field' => 'boolean',
            'arrived_at' => 'datetime',
            'received_at' => 'datetime',
        ];
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeExcludingSmoke(Builder $query): Builder
    {
        return $query->where('source', 'not like', self::SMOKE_SOURCE_PREFIX.'%');
    }

    /**
     * Enforce append-only model constraint at the framework level.
     * Prevents updates and deletions on instances of this model.
     */
    protected static function booted(): void
    {
        static::updating(function (DataIngestionLog $model) {
            throw new \Exception('DataIngestionLog is append-only. Updates are forbidden.');
        });

        static::deleting(function (DataIngestionLog $model) {
            throw new \Exception('DataIngestionLog is append-only. Deletions are forbidden.');
        });
    }
}
