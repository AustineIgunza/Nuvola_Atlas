<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlertRule extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'last_fired_at' => 'datetime',
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

    /**
     * Should this rule fire given the current zone score?
     * Returns false when the rule is inactive, when the score is null,
     * or when the last-fired throttle (30 min) is still active.
     */
    public function shouldFire(?int $currentScore): bool
    {
        if (! $this->active || $currentScore === null) return false;
        if ($this->last_fired_at !== null && $this->last_fired_at->gt(now()->subMinutes(30))) {
            return false;
        }

        $prev = $this->last_score_seen;
        $threshold = $this->threshold_score;

        return match ($this->direction) {
            'below' => $currentScore < $threshold && ($prev === null || $prev >= $threshold),
            'above' => $currentScore > $threshold && ($prev === null || $prev <= $threshold),
            'change' => $prev !== null && abs($currentScore - $prev) >= $threshold,
            default => false,
        };
    }
}
