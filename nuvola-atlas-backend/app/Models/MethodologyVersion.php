<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MethodologyVersion extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'weights' => 'array',
            'bands' => 'array',
            'is_current' => 'boolean',
            'draft' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    /**
     * Convenience — the currently promoted methodology, cached in-process.
     * Callers that need aggressive caching should wrap with Cache::remember;
     * MethodologyPublisher (Khillon Week 3) invalidates that cache on publish.
     */
    public static function current(): ?self
    {
        return self::query()->where('is_current', true)->first();
    }
}
