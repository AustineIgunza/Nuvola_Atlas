<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DataFeedStatus extends Model
{
    protected $table = 'data_feed_status';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'last_delivered_at' => 'datetime',
            'verified_records' => 'int',
            'expected_frequency_min' => 'int',
        ];
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    /**
     * Compute freshness state on read — never stored on the row.
     * Returns one of: 'fresh' | 'stale' | 'overdue' | 'missing'.
     */
    public function freshnessState(?\DateTimeImmutable $now = null): string
    {
        if ($this->last_delivered_at === null) {
            return 'missing';
        }
        $now ??= new \DateTimeImmutable();
        $ageMin = (int) (($now->getTimestamp() - $this->last_delivered_at->getTimestamp()) / 60);
        $sla = max(1, $this->expected_frequency_min);

        if ($ageMin <= $sla) {
            return 'fresh';
        }
        if ($ageMin <= $sla * 3) {
            return 'stale';
        }
        return 'overdue';
    }
}
