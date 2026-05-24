<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ZoneSeeder extends Seeder
{
    public function run(): void
    {
        $zones = [
            ['id' => 'westlands', 'name' => 'Westlands', 'score' => 76, 'pillar_social' => 82, 'pillar_safety' => 71, 'pillar_density' => 64, 'pillar_infra' => 80, 'delta_social' => 3, 'delta_safety' => -1, 'delta_density' => 2, 'delta_infra' => 4, 'lon' => 36.8048, 'lat' => -1.2673, 'last_sync_min' => 4],
            ['id' => 'dagoretti-north', 'name' => 'Dagoretti North', 'score' => 72, 'pillar_social' => 74, 'pillar_safety' => 68, 'pillar_density' => 70, 'pillar_infra' => 66, 'delta_social' => 2, 'delta_safety' => 1, 'delta_density' => -2, 'delta_infra' => 3, 'lon' => 36.7600, 'lat' => -1.2750, 'last_sync_min' => 7],
            ['id' => 'dagoretti-south', 'name' => 'Dagoretti South', 'score' => 65, 'pillar_social' => 62, 'pillar_safety' => 64, 'pillar_density' => 60, 'pillar_infra' => 68, 'delta_social' => 1, 'delta_safety' => -3, 'delta_density' => 2, 'delta_infra' => 1, 'lon' => 36.7450, 'lat' => -1.3050, 'last_sync_min' => 12],
            ['id' => 'langata', 'name' => 'Langata', 'score' => 70, 'pillar_social' => 72, 'pillar_safety' => 74, 'pillar_density' => 55, 'pillar_infra' => 71, 'delta_social' => -1, 'delta_safety' => 2, 'delta_density' => 1, 'delta_infra' => 3, 'lon' => 36.7350, 'lat' => -1.3600, 'last_sync_min' => 5],
            ['id' => 'kibra', 'name' => 'Kibra', 'score' => 54, 'pillar_social' => 48, 'pillar_safety' => 52, 'pillar_density' => 58, 'pillar_infra' => 56, 'delta_social' => 2, 'delta_safety' => -2, 'delta_density' => 1, 'delta_infra' => 0, 'lon' => 36.7850, 'lat' => -1.3150, 'last_sync_min' => 18],
            ['id' => 'roysambu', 'name' => 'Roysambu', 'score' => 68, 'pillar_social' => 70, 'pillar_safety' => 65, 'pillar_density' => 62, 'pillar_infra' => 72, 'delta_social' => 1, 'delta_safety' => 3, 'delta_density' => -1, 'delta_infra' => 2, 'lon' => 36.8750, 'lat' => -1.2200, 'last_sync_min' => 9],
            ['id' => 'kasarani', 'name' => 'Kasarani', 'score' => 63, 'pillar_social' => 60, 'pillar_safety' => 62, 'pillar_density' => 58, 'pillar_infra' => 68, 'delta_social' => -1, 'delta_safety' => 2, 'delta_density' => 0, 'delta_infra' => 1, 'lon' => 36.9000, 'lat' => -1.2350, 'last_sync_min' => 6],
            ['id' => 'ruaraka', 'name' => 'Ruaraka', 'score' => 66, 'pillar_social' => 68, 'pillar_safety' => 64, 'pillar_density' => 60, 'pillar_infra' => 70, 'delta_social' => 2, 'delta_safety' => 0, 'delta_density' => -1, 'delta_infra' => 3, 'lon' => 36.8800, 'lat' => -1.2500, 'last_sync_min' => 11],
            ['id' => 'embakasi-south', 'name' => 'Embakasi South', 'score' => 58, 'pillar_social' => 55, 'pillar_safety' => 56, 'pillar_density' => 62, 'pillar_infra' => 58, 'delta_social' => 1, 'delta_safety' => -1, 'delta_density' => 2, 'delta_infra' => 0, 'lon' => 36.9100, 'lat' => -1.3300, 'last_sync_min' => 14],
            ['id' => 'embakasi-north', 'name' => 'Embakasi North', 'score' => 62, 'pillar_social' => 60, 'pillar_safety' => 64, 'pillar_density' => 56, 'pillar_infra' => 66, 'delta_social' => 0, 'delta_safety' => 2, 'delta_density' => 1, 'delta_infra' => -1, 'lon' => 36.9050, 'lat' => -1.2800, 'last_sync_min' => 8],
            ['id' => 'embakasi-central', 'name' => 'Embakasi Central', 'score' => 60, 'pillar_social' => 58, 'pillar_safety' => 60, 'pillar_density' => 54, 'pillar_infra' => 64, 'delta_social' => 1, 'delta_safety' => 1, 'delta_density' => -2, 'delta_infra' => 2, 'lon' => 36.8900, 'lat' => -1.3100, 'last_sync_min' => 10],
            ['id' => 'embakasi-east', 'name' => 'Embakasi East', 'score' => 76, 'pillar_social' => 78, 'pillar_safety' => 72, 'pillar_density' => 70, 'pillar_infra' => 82, 'delta_social' => 4, 'delta_safety' => 2, 'delta_density' => 1, 'delta_infra' => 5, 'lon' => 36.9300, 'lat' => -1.2900, 'last_sync_min' => 3],
            ['id' => 'embakasi-west', 'name' => 'Embakasi West', 'score' => 61, 'pillar_social' => 58, 'pillar_safety' => 62, 'pillar_density' => 56, 'pillar_infra' => 66, 'delta_social' => -1, 'delta_safety' => 1, 'delta_density' => 0, 'delta_infra' => 2, 'lon' => 36.8700, 'lat' => -1.3200, 'last_sync_min' => 15],
            ['id' => 'makadara', 'name' => 'Makadara', 'score' => 64, 'pillar_social' => 62, 'pillar_safety' => 66, 'pillar_density' => 58, 'pillar_infra' => 68, 'delta_social' => 2, 'delta_safety' => -1, 'delta_density' => 1, 'delta_infra' => 3, 'lon' => 36.8600, 'lat' => -1.2950, 'last_sync_min' => 7],
            ['id' => 'kamukunji', 'name' => 'Kamukunji', 'score' => 57, 'pillar_social' => 54, 'pillar_safety' => 52, 'pillar_density' => 60, 'pillar_infra' => 58, 'delta_social' => -2, 'delta_safety' => 1, 'delta_density' => 3, 'delta_infra' => 0, 'lon' => 36.8450, 'lat' => -1.2800, 'last_sync_min' => 20],
            ['id' => 'starehe', 'name' => 'Starehe', 'score' => 69, 'pillar_social' => 66, 'pillar_safety' => 68, 'pillar_density' => 72, 'pillar_infra' => 70, 'delta_social' => 1, 'delta_safety' => 2, 'delta_density' => -1, 'delta_infra' => 2, 'lon' => 36.8250, 'lat' => -1.2850, 'last_sync_min' => 5],
            ['id' => 'mathare', 'name' => 'Mathare', 'score' => 52, 'pillar_social' => 46, 'pillar_safety' => 48, 'pillar_density' => 56, 'pillar_infra' => 54, 'delta_social' => -1, 'delta_safety' => -2, 'delta_density' => 1, 'delta_infra' => 0, 'lon' => 36.8580, 'lat' => -1.2580, 'last_sync_min' => 22],
        ];

        $now = now();

        foreach ($zones as $zone) {
            $lon = $zone['lon'];
            $lat = $zone['lat'];
            unset($zone['lon'], $zone['lat']);

            DB::table('zones')->insert(array_merge($zone, [
                'centroid' => DB::raw("ST_MakePoint({$lon}, {$lat})::geography"),
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }
    }
}
