<?php

declare(strict_types=1);

namespace Tests\Feature\Scoring;

use App\Events\ZoneScoreUpdated;
use App\Jobs\RecalculateAllZones;
use App\Jobs\RecalculateZoneScore;
use App\Support\Pillars;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\Support\PillarSeeding;
use Tests\TestCase;

class RecalculateAllZonesTest extends TestCase
{
    private function seedZone(string $id, int $value = 70): void
    {
        $pillars = PillarSeeding::columns(array_fill_keys(Pillars::keys(), $value));

        $cols = implode(', ', array_keys($pillars));
        $placeholders = implode(', ', array_fill(0, count($pillars), '?'));

        DB::statement(
            "INSERT INTO zones (id, name, score, {$cols}, last_sync_min,
             centroid, created_at, updated_at)
             VALUES (?, ?, 0, {$placeholders}, 99,
             ST_GeogFromText('POINT(36.82 -1.29)'), now(), now())",
            array_merge([$id, ucfirst($id)], array_values($pillars))
        );
    }

    public function test_bulk_job_dispatches_per_zone_jobs(): void
    {
        Queue::fake();

        $this->seedZone('bulk-a');
        $this->seedZone('bulk-b');
        $this->seedZone('bulk-c');

        (new RecalculateAllZones)->handle();

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
                && array_keys($payload['pillars']) === Pillars::keys()
                && array_key_exists('missingPillars', $payload)
                && $payload['pillarsTotal'] === count(Pillars::keys())
                && $payload['pillarRegistryVersion'] === Pillars::version();
        });
    }
}
