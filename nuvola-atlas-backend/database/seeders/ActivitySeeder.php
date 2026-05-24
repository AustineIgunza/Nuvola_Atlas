<?php

namespace Database\Seeders;

use App\Models\Activity;
use Illuminate\Database\Seeder;

class ActivitySeeder extends Seeder
{
    public function run(): void
    {
        $activities = [
            ['id' => 'act1', 'zone_id' => 'westlands', 'kind' => 'road', 'text' => 'Waiyaki Way Phase 2 paving completed ahead of schedule', 'source' => 'KeNHA', 'created_at' => '2026-05-22 08:00:00'],
            ['id' => 'act2', 'zone_id' => 'westlands', 'kind' => 'grid', 'text' => 'Smart meter rollout reached 1,200 units in Parklands', 'source' => 'KPLC', 'created_at' => '2026-05-20 14:30:00'],
            ['id' => 'act3', 'zone_id' => 'westlands', 'kind' => 'esia', 'text' => 'Updated ESIA for Westlands commercial zone published', 'source' => 'NEMA', 'created_at' => '2026-05-18 10:00:00'],
            ['id' => 'act4', 'zone_id' => 'westlands', 'kind' => 'density', 'text' => 'Population density survey updated for Q1 2026', 'source' => 'KNBS', 'created_at' => '2026-05-15 09:00:00'],
            ['id' => 'act5', 'zone_id' => 'starehe', 'kind' => 'road', 'text' => 'Inner Ring contractor issued show-cause notice', 'source' => 'KURA', 'created_at' => '2026-05-20 09:30:00'],
            ['id' => 'act6', 'zone_id' => 'starehe', 'kind' => 'grid', 'text' => 'Fibre backbone extended to CBD junction', 'source' => 'ICTA', 'created_at' => '2026-05-16 11:00:00'],
            ['id' => 'act7', 'zone_id' => 'embakasi-east', 'kind' => 'grid', 'text' => 'Substation transformer testing completed successfully', 'source' => 'KETRACO', 'created_at' => '2026-05-21 15:00:00'],
            ['id' => 'act8', 'zone_id' => 'embakasi-east', 'kind' => 'road', 'text' => 'Access road to substation graded', 'source' => 'KURA', 'created_at' => '2026-05-19 10:00:00'],
        ];

        foreach ($activities as $activity) {
            Activity::create($activity);
        }
    }
}
