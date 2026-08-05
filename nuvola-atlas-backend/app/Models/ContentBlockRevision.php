<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentBlockRevision extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'edited_at' => 'datetime',
        ];
    }

    public function block(): BelongsTo
    {
        return $this->belongsTo(ContentBlock::class, 'content_block_key', 'key');
    }

    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'edited_by');
    }
}
