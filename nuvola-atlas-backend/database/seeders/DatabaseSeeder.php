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
        ]);
    }
}
