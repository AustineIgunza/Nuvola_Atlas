<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Scoring\ScoreCalculator;
use App\Models\Zone;
use App\Support\Pillars;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds the 17 Nairobi sub-counties for local development.
 *
 * THE PILLAR VALUES BELOW ARE FIXTURES, NOT MEASUREMENTS. They exist so a
 * fresh clone has something to render and so the partial-data paths get
 * exercised; they are not sourced, carry no vintage, and must never be shown
 * to a partner. The real values arrive with the data package — at which point
 * this seeder stops writing pillar values at all.
 *
 * They are deliberately NOT derived from the retired indicator columns. An
 * average of "healthcare access" and "digital connectivity" is not a water
 * and sanitation figure, and laundering one into the other would produce
 * exactly the invented-proxy number the refocus exists to remove.
 *
 * Several pillars are left null on purpose so the "2 of 4 pillars measured"
 * badge and the "Awaiting data" state have something to render.
 */
class ZoneSeeder extends Seeder
{
    /**
     * key => [name, lon, lat, last_sync_min, pillar fixtures]
     */
    private const FIXTURES = [
        'westlands' => ['Westlands', 36.8048, -1.2673, 4, [
            'water_sanitation' => 81, 'road_density' => 78, 'transit_access' => 74, 'electricity_access' => 93,
        ]],
        'dagoretti-north' => ['Dagoretti North', 36.7600, -1.2750, 7, [
            'water_sanitation' => 72, 'road_density' => 64, 'transit_access' => 69, 'electricity_access' => 88,
        ]],
        'dagoretti-south' => ['Dagoretti South', 36.7450, -1.3050, 12, [
            'water_sanitation' => 65, 'road_density' => 58, 'transit_access' => 61, 'electricity_access' => 84,
        ]],
        'langata' => ['Langata', 36.7350, -1.3600, 5, [
            'water_sanitation' => 74, 'road_density' => 55, 'transit_access' => 58, 'electricity_access' => 90,
        ]],
        'kibra' => ['Kibra', 36.7850, -1.3150, 18, [
            'water_sanitation' => 39, 'road_density' => 31, 'transit_access' => 66, 'electricity_access' => null,
        ]],
        'roysambu' => ['Roysambu', 36.8750, -1.2200, 9, [
            'water_sanitation' => 70, 'road_density' => 62, 'transit_access' => 67, 'electricity_access' => 87,
        ]],
        'kasarani' => ['Kasarani', 36.9000, -1.2350, 6, [
            'water_sanitation' => 63, 'road_density' => 57, 'transit_access' => 60, 'electricity_access' => 83,
        ]],
        'ruaraka' => ['Ruaraka', 36.8800, -1.2500, 11, [
            'water_sanitation' => 66, 'road_density' => 61, 'transit_access' => 64, 'electricity_access' => 85,
        ]],
        'embakasi-south' => ['Embakasi South', 36.9100, -1.3300, 14, [
            'water_sanitation' => 54, 'road_density' => 52, 'transit_access' => 56, 'electricity_access' => 79,
        ]],
        'embakasi-north' => ['Embakasi North', 36.9050, -1.2800, 8, [
            'water_sanitation' => 58, 'road_density' => 55, 'transit_access' => 59, 'electricity_access' => 81,
        ]],
        'embakasi-central' => ['Embakasi Central', 36.8900, -1.3100, 10, [
            'water_sanitation' => 56, 'road_density' => 53, 'transit_access' => 57, 'electricity_access' => 80,
        ]],
        'embakasi-east' => ['Embakasi East', 36.9300, -1.2900, 3, [
            'water_sanitation' => 77, 'road_density' => 68, 'transit_access' => 63, 'electricity_access' => 89,
        ]],
        'embakasi-west' => ['Embakasi West', 36.8700, -1.3200, 15, [
            'water_sanitation' => 59, 'road_density' => 56, 'transit_access' => 62, 'electricity_access' => 82,
        ]],
        'makadara' => ['Makadara', 36.8600, -1.2950, 7, [
            'water_sanitation' => 64, 'road_density' => 70, 'transit_access' => 72, 'electricity_access' => 86,
        ]],
        'kamukunji' => ['Kamukunji', 36.8450, -1.2800, 20, [
            'water_sanitation' => 51, 'road_density' => 73, 'transit_access' => null, 'electricity_access' => 78,
        ]],
        'starehe' => ['Starehe', 36.8250, -1.2850, 5, [
            'water_sanitation' => 68, 'road_density' => 82, 'transit_access' => 79, 'electricity_access' => 91,
        ]],
        'mathare' => ['Mathare', 36.8580, -1.2580, 22, [
            'water_sanitation' => 36, 'road_density' => null, 'transit_access' => 61, 'electricity_access' => null,
        ]],
    ];

    public function run(): void
    {
        $now = now();
        $calc = new ScoreCalculator;

        foreach (self::FIXTURES as $id => [$name, $lon, $lat, $lastSync, $pillars]) {
            $columns = [];
            foreach (Pillars::keys() as $key) {
                $columns[Pillars::column($key)] = $pillars[$key] ?? null;
            }

            $row = array_merge(
                ['id' => $id, 'name' => $name, 'last_sync_min' => $lastSync],
                $columns,
                [
                    'centroid' => DB::raw("ST_MakePoint({$lon}, {$lat})::geography"),
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );

            // Scored through the production calculator so seed data behaves
            // the same way live data does, including the null handling.
            $row['score'] = $calc->calculateScore((new Zone)->forceFill($row));

            DB::table('zones')->insert($row);
        }
    }
}
