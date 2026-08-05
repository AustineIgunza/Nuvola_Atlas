<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Firm;
use App\Models\FirmWatchlist;
use Illuminate\Database\Seeder;

/**
 * Realistic tier-appropriate watchlist mix:
 *  - Acumen (deal): CBD growth zones — Westlands, Starehe.
 *  - Andela (basic): emerging suburbs — Kasarani, Embakasi East.
 *  - GCF Sovereign: informal-settlement priorities — Kibra, Mathare.
 *
 * Uniqueness on (firm_id, zone_id) means updateOrCreate keeps re-runs
 * idempotent.
 */
class FirmWatchlistSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            'acumen-east-africa' => [
                ['zone' => 'westlands', 'priority' => 1, 'thesis' => 'CBD-adjacent commercial growth; strong infrastructure and talent density.'],
                ['zone' => 'starehe', 'priority' => 2, 'thesis' => 'Mixed-use redevelopment corridor; watch congestion + waste indicators.'],
            ],
            'andela-ventures' => [
                ['zone' => 'kasarani', 'priority' => 1, 'thesis' => 'Emerging talent pool; monitor digital connectivity trend.'],
                ['zone' => 'embakasi-east', 'priority' => 2, 'thesis' => 'Airport-adjacent industrial density; strong road_quality reads.'],
            ],
            'gcf-nairobi-corridor' => [
                ['zone' => 'kibra', 'priority' => 1, 'thesis' => 'Informal settlement priority — SDG 6 water & sanitation focus.'],
                ['zone' => 'mathare', 'priority' => 1, 'thesis' => 'Informal settlement priority; blended-finance sanitation pilot candidate.'],
            ],
        ];

        foreach ($plans as $firmSlug => $entries) {
            $firm = Firm::where('slug', $firmSlug)->first();
            if (! $firm) {
                continue;
            }

            foreach ($entries as $entry) {
                FirmWatchlist::updateOrCreate(
                    ['firm_id' => $firm->id, 'zone_id' => $entry['zone']],
                    [
                        'priority' => $entry['priority'],
                        'thesis' => $entry['thesis'],
                    ],
                );
            }
        }
    }
}
