<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContentBlock extends Model
{
    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    public function revisions(): HasMany
    {
        return $this->hasMany(ContentBlockRevision::class, 'content_block_key', 'key');
    }
}
