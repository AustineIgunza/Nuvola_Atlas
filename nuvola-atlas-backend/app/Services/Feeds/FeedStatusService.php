<?php

declare(strict_types=1);

namespace App\Services\Feeds;

use App\Models\DataFeedStatus;

/**
 * Reads over `data_feed_status` — staleness is computed on read via
 * DataFeedStatus::freshnessState(), never persisted. That keeps SLA
 * changes free (no data migration required).
 */
class FeedStatusService
{
    /**
     * @return array{
     *   summary: array{fresh: int, stale: int, overdue: int, missing: int, total: int},
     *   feeds: list<array{
     *     id: int,
     *     zone_id: string,
     *     zone_name: ?string,
     *     pillar_key: string,
     *     feed_name: string,
     *     source_system: ?string,
     *     last_delivered_at: ?string,
     *     expected_frequency_min: int,
     *     verified_records: int,
     *     state: string,
     *     age_min: ?int
     *   }>
     * }
     */
    public function matrix(): array
    {
        $rows = DataFeedStatus::with('zone')->get();
        $now = new \DateTimeImmutable;

        $summary = ['fresh' => 0, 'stale' => 0, 'overdue' => 0, 'missing' => 0, 'total' => $rows->count()];
        $feeds = $rows->map(function (DataFeedStatus $row) use (&$summary, $now) {
            $state = $row->freshnessState($now);
            $summary[$state]++;

            $ageMin = null;
            if ($row->last_delivered_at !== null) {
                $ageMin = (int) (($now->getTimestamp() - $row->last_delivered_at->getTimestamp()) / 60);
            }

            return [
                'id' => $row->id,
                'zone_id' => $row->zone_id,
                'zone_name' => $row->zone?->name,
                'pillar_key' => $row->pillar_key,
                'feed_name' => $row->feed_name,
                'source_system' => $row->source_system,
                'last_delivered_at' => $row->last_delivered_at?->toIso8601String(),
                'expected_frequency_min' => $row->expected_frequency_min,
                'verified_records' => $row->verified_records,
                'state' => $state,
                'age_min' => $ageMin,
            ];
        })->values()->all();

        return ['summary' => $summary, 'feeds' => $feeds];
    }
}
