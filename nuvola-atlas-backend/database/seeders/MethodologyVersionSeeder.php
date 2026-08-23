<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\MethodologyVersion;
use App\Support\Pillars;
use Illuminate\Database\Seeder;

/**
 * Seed the current methodology row from the pillar registry, so a freshly
 * seeded database scores exactly as an unseeded one does. Bands express the
 * score-band thresholds the Scorecard uses to colour the ring.
 *
 * The migration installed a partial unique index on is_current, so this
 * seeder can only ever have one active row.
 */
class MethodologyVersionSeeder extends Seeder
{
    public function run(): void
    {
        MethodologyVersion::updateOrCreate(
            ['version' => Pillars::version()],
            [
                'weights' => Pillars::weights(),
                'bands' => [
                    ['label' => 'excellent', 'min' => 80, 'max' => 100],
                    ['label' => 'good',      'min' => 60, 'max' => 79],
                    ['label' => 'attention', 'min' => 40, 'max' => 59],
                    ['label' => 'critical',  'min' => 0,  'max' => 39],
                ],
                'is_current' => true,
                'draft' => false,
                'changelog' => 'Registry weights — water 0.4, roads 0.3, transit 0.3; electricity held at 0. Null-exclusion averaging.',
                'published_at' => now(),
            ],
        );
    }
}
