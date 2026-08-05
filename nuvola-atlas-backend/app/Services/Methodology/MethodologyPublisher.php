<?php

declare(strict_types=1);

namespace App\Services\Methodology;

use App\Jobs\RecalculateAllZones;
use App\Models\MethodologyVersion;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Promotes a methodology row to `is_current = true` and dispatches a
 * full-fleet score recalculation.
 *
 * Transactional swap: the previous `is_current` row is flipped off inside
 * the same transaction as the new one is flipped on, so the
 * partial-unique-index constraint on `is_current WHERE is_current` cannot
 * transiently fail. If the flip succeeds, we invalidate the
 * `vitality_methodology` cache and queue `RecalculateAllZones` so every
 * zone's composite score reflects the new weights.
 */
class MethodologyPublisher
{
    /**
     * @param  MethodologyVersion  $target
     * @param  User|null  $publisher
     * @throws RuntimeException  when the target is already current or is a draft
     */
    public function publish(MethodologyVersion $target, ?User $publisher = null): MethodologyVersion
    {
        if ($target->draft) {
            throw new RuntimeException('Cannot publish a draft methodology version.');
        }

        DB::transaction(function () use ($target, $publisher) {
            MethodologyVersion::query()
                ->where('is_current', true)
                ->where('id', '!=', $target->id)
                ->update(['is_current' => false]);

            $target->is_current = true;
            $target->published_at = now();
            $target->published_by = $publisher?->id;
            $target->save();
        });

        Cache::forget('vitality_methodology');
        RecalculateAllZones::dispatch(broadcast: true);

        return $target->refresh();
    }

    /**
     * Preview the effect of a proposed weight vector without touching the
     * live methodology. Used by /admin/methodology preview endpoint.
     *
     * @param  array{social: float, safety: float, density: float, infra: float} $weights
     */
    public function previewImpact(array $weights): MethodologyPreview
    {
        return new MethodologyPreview($weights);
    }
}
