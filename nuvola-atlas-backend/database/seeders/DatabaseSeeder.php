<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            ZoneSeeder::class,
            ZoneBoundarySeeder::class,
            ZoneLayerSeeder::class,
            ProjectSeeder::class,
            AlertSeeder::class,
            ReportSeeder::class,
            HistorySeeder::class,
            ActivitySeeder::class,
            // Phase E — firms, investor accounts, watchlists, methodology,
            // feed status. Ordered: parents before children.
            FirmSeeder::class,
            FirmUserSeeder::class,
            FirmWatchlistSeeder::class,
            MethodologyVersionSeeder::class,
            FeedStatusSeeder::class,
        ]);

        // Backfill fake time-series only in non-prod so the trend chart renders
        // on a fresh clone; prod fills the table naturally via the hourly
        // atlas:recalculate-scores cron.
        if (app()->environment(['local', 'testing', 'development'])) {
            $this->call(ZoneScoreSnapshotSeeder::class);
        }
    }
}
