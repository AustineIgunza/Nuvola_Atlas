<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\DataFeedStatus;
use Illuminate\Database\Seeder;

/**
 * Staggered per-indicator staleness so /admin/feeds renders a mix of
 * fresh / stale / overdue rows out of the box. Uses only the 5 pilot
 * zones — the full 17-sub-county matrix is populated organically once
 * Daystar delivery starts.
 */
class FeedStatusSeeder extends Seeder
{
    public function run(): void
    {
        // (zone_id, indicator, feed_name, source, expected_frequency_min, minutes_since_last_delivery)
        $rows = [
            // Fresh — under SLA.
            ['westlands', 'healthcare_access', 'knbs.health', 'KNBS', 1440, 120],
            ['westlands', 'digital_connectivity', 'ca.internet', 'CA Kenya', 2880, 60],
            ['starehe', 'crime_rates', 'nps.crime', 'NPS', 4320, 900],
            // Stale — over SLA, under 3× SLA.
            ['kasarani', 'road_quality', 'kura.projects', 'KURA', 10080, 12000],
            ['embakasi-east', 'energy_reliability', 'kplc.outages', 'KPLC', 1440, 2200],
            ['dagoretti-north', 'population_density', 'knbs.pop', 'KNBS', 129600, 250000],
            // Overdue — >3× SLA.
            ['kibra', 'waste_management', 'nema.waste', 'NEMA', 10080, 50000],
            ['mathare', 'education_access', 'moe.schools', 'MoE', 43200, 200000],
            // Missing — no delivery yet.
            ['kibra', 'digital_connectivity', 'ca.internet', 'CA Kenya', 2880, null],
            ['mathare', 'waste_management', 'nema.waste', 'NEMA', 10080, null],
        ];

        foreach ($rows as [$zoneId, $indicator, $feedName, $source, $freqMin, $ageMin]) {
            DataFeedStatus::updateOrCreate(
                ['zone_id' => $zoneId, 'indicator_key' => $indicator],
                [
                    'feed_name' => $feedName,
                    'source_system' => $source,
                    'expected_frequency_min' => $freqMin,
                    'last_delivered_at' => $ageMin === null ? null : now()->subMinutes($ageMin),
                    'verified_records' => $ageMin === null ? 0 : rand(10, 200),
                ],
            );
        }
    }
}
