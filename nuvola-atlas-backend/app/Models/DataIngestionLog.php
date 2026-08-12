<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DataIngestionLog extends Model
{
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
