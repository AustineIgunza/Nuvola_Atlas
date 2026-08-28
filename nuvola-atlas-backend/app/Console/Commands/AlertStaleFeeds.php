<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domain\Feeds\FeedStatusService;
use App\Models\Alert;
use App\Support\Audit;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Nightly automation. Walks the FeedStatusService matrix and creates
 * a single 'system' alert per overdue OR missing feed cluster, so
 * admins wake up to a visible list of feeds that missed SLA overnight.
 *
 * Deduplicates against alerts created in the last 24h so a persistently
 * overdue feed doesn't spam the alerts page every night.
 */
class AlertStaleFeeds extends Command
{
    protected $signature = 'nuvola:alert-stale-feeds';

    protected $description = 'Emit a single alert per overdue/missing feed cluster (dedup vs last 24h).';

    public function __construct(private FeedStatusService $service)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $matrix = $this->service->matrix();
        $offenders = array_values(array_filter(
            $matrix['feeds'],
            fn ($f) => in_array($f['state'], ['overdue', 'missing'], true),
        ));

        if (empty($offenders)) {
            $this->info('All feeds are fresh or stale-under-SLA. Nothing to alert.');

            return self::SUCCESS;
        }

        $emitted = 0;
        foreach ($offenders as $feed) {
            $existing = Alert::query()
                ->where('kind', 'system')
                ->where('zone_id', $feed['zone_id'])
                ->where('title', 'like', "%{$feed['pillar_key']}%")
                ->where('created_at', '>=', now()->subHours(24))
                ->exists();
            if ($existing) {
                continue;
            }

            $alert = Alert::create([
                'id' => (string) Str::uuid(),
                'severity' => $feed['state'] === 'missing' ? 'high' : 'medium',
                'kind' => 'system',
                'title' => ucfirst($feed['state'])." feed: {$feed['pillar_key']} for {$feed['zone_name']}",
                'body' => "Source: {$feed['source_system']}. SLA {$feed['expected_frequency_min']} min; last delivered "
                    .($feed['age_min'] === null ? 'never' : "{$feed['age_min']} min ago").'.',
                'zone_id' => $feed['zone_id'],
                'read' => false,
            ]);
            $emitted++;
            Audit::record('cron.alert_stale_feed', $alert);
        }

        $this->info("Emitted {$emitted} stale-feed alerts.");

        return self::SUCCESS;
    }
}
