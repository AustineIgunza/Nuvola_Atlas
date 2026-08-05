<?php

declare(strict_types=1);

namespace Tests\Feature\Scoring;

use App\Events\ZoneScoreUpdated;
use App\Jobs\RecalculateAllZones;
use App\Jobs\RecalculateZoneScore;
use App\Models\Zone;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\Support\IndicatorSeeding;
use Tests\TestCase;

class RecalculateAllZonesTest extends TestCase
{
    private function seedZone(string $id, int $pillar = 70): void
    {
        $indicators = IndicatorSeeding::fromPillars([
            'social' => $pillar,
            'safety' => $pillar,
            'density' => $pillar,
            'infra' => $pillar,
        ]);

        $indicatorCols = implode(', ', array_keys($indicators));
        $indicatorPlaceholders = implode(', ', array_fill(0, count($indicators), '?'));

        DB::statement(
            "INSERT INTO zones (id, name, score, {$indicatorCols}, last_sync_min,
             centroid, created_at, updated_at)
             VALUES (?, ?, 0, {$indicatorPlaceholders}, 99,
             ST_GeogFromText('POINT(36.82 -1.29)'), now(), now())",
            array_merge([$id, ucfirst($id)], array_values($indicators))
        );
    }

    public function test_bulk_job_dispatches_per_zone_jobs(): void
    {
        Queue::fake();

        $this->seedZone('bulk-a');
        $this->seedZone('bulk-b');
        $this->seedZone('bulk-c');

        (new RecalculateAllZones())->handle();

        Queue::assertPushed(RecalculateZoneScore::class, 3);
        Queue::assertPushed(RecalculateZoneScore::class, fn ($job) => $job->zoneId === 'bulk-a');
        Queue::assertPushed(RecalculateZoneScore::class, fn ($job) => $job->zoneId === 'bulk-b');
        Queue::assertPushed(RecalculateZoneScore::class, fn ($job) => $job->zoneId === 'bulk-c');
    }

    public function test_bulk_job_forwards_broadcast_flag(): void
    {
        Queue::fake();

        $this->seedZone('bulk-flag');

        (new RecalculateAllZones(broadcast: false))->handle();

        Queue::assertPushed(RecalculateZoneScore::class, function ($job) {
            return $job->zoneId === 'bulk-flag' && $job->broadcast === false;
        });
    }

    public function test_zone_score_updated_broadcast_payload_shape(): void
    {
        Event::fake([ZoneScoreUpdated::class]);

        $this->seedZone('broadcast-zone');

        RecalculateZoneScore::dispatchSync('broadcast-zone', true);

        Event::assertDispatched(ZoneScoreUpdated::class, function (ZoneScoreUpdated $event) {
            $payload = $event->broadcastWith();

            return $event->broadcastOn()[0]->name === 'private-zones.broadcast-zone'
                && isset($payload['score'])
                && isset($payload['pillars']['social'])
                && isset($payload['pillars']['safety'])
                && isset($payload['pillars']['density'])
                && isset($payload['pillars']['infra'])
                && array_key_exists('missingIndicators', $payload)
                && $payload['indicatorsTotal'] === 13;
        });
    }
}
