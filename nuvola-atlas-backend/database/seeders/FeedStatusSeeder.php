<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\DataFeedStatus;
use Illuminate\Database\Seeder;

/**
 * Staggered per-pillar staleness so /admin/feeds renders a mix of
 * fresh / stale / overdue / missing rows out of the box. Uses only the 5 pilot
 * zones — the full 17-sub-county matrix is populated organically once
 * Daystar delivery starts.
 *
 * The feeds named here are the real upstream sources behind each pillar, so
 * an overdue row points at something a person could actually go and chase.
 * The delivery ages are fixtures.
 */
class FeedStatusSeeder extends Seeder
{
    /** (zone_id, pillar_key, feed_name, source, expected_frequency_min, minutes_since_last_delivery, vintage, granularity) */
    private const ROWS = [
        // Fresh — under SLA.
        ['westlands', 'road_density', 'hotosm.roads', 'HOT OSM', 43200, 1200, null, 'subcounty'],
        ['westlands', 'transit_access', 'digitalmatatus.gtfs', 'Digital Matatus', 43200, 8000, null, 'subcounty'],
        ['starehe', 'road_density', 'hotosm.roads', 'HOT OSM', 43200, 1200, null, 'subcounty'],
        // Stale — over SLA, under 3× SLA. WASREB is annual and utility-granularity;
        // recording vintage + granularity keeps the staleness ledger honest about
        // what "overdue" means for a FY-cadence feed vs. an hourly one.
        ['kasarani', 'water_sanitation', 'wasreb.impact', 'WASREB', 525600, 700000, 'FY2023/24', 'utility'],
        ['embakasi-east', 'transit_access', 'digitalmatatus.gtfs', 'Digital Matatus', 43200, 90000, null, 'subcounty'],
        // Overdue — >3× SLA.
        ['kibra', 'water_sanitation', 'wasreb.impact', 'WASREB', 525600, 2000000, 'FY2023/24', 'utility'],
        ['mathare', 'road_density', 'hotosm.roads', 'HOT OSM', 43200, 400000, null, 'subcounty'],
        // Missing — no delivery yet.
        ['kibra', 'electricity_access', 'knbs.census', 'KNBS', 525600, null, '2019', 'subcounty'],
        ['mathare', 'electricity_access', 'knbs.census', 'KNBS', 525600, null, '2019', 'subcounty'],
        ['mathare', 'water_sanitation', 'wasreb.impact', 'WASREB', 525600, null, 'FY2023/24', 'utility'],
    ];

    public function run(): void
    {
        foreach (self::ROWS as [$zoneId, $pillarKey, $feedName, $source, $freqMin, $ageMin, $vintage, $granularity]) {
            DataFeedStatus::updateOrCreate(
                ['zone_id' => $zoneId, 'pillar_key' => $pillarKey],
                [
                    'feed_name' => $feedName,
                    'source_system' => $source,
                    'expected_frequency_min' => $freqMin,
                    'last_delivered_at' => $ageMin === null ? null : now()->subMinutes($ageMin),
                    'verified_records' => $ageMin === null ? 0 : rand(10, 200),
                    'vintage' => $vintage,
                    'granularity' => $granularity,
                ],
            );
        }
    }
}
