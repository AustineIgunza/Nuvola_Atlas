<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\MethodologyVersion;
use Illuminate\Database\Seeder;

/**
 * Seed the v1.0.0 methodology row as `is_current = true`. Weights are
 * 0.25 across the four pillars (post-July-2026 rewrite); bands express
 * the score-band thresholds the Scorecard uses to colour the ring.
 *
 * The migration installed a partial unique index on is_current, so this
 * seeder can only ever have one active row.
 */
class MethodologyVersionSeeder extends Seeder
{
    public function run(): void
    {
        MethodologyVersion::updateOrCreate(
            ['version' => '1.0.0'],
            [
                'weights' => [
                    'social' => 0.25,
                    'safety' => 0.25,
                    'density' => 0.25,
                    'infra' => 0.25,
                ],
                'bands' => [
                    ['label' => 'excellent', 'min' => 80, 'max' => 100],
                    ['label' => 'good',      'min' => 60, 'max' => 79],
                    ['label' => 'attention', 'min' => 40, 'max' => 59],
                    ['label' => 'critical',  'min' => 0,  'max' => 39],
                ],
                'is_current' => true,
                'draft' => false,
                'changelog' => 'Initial published methodology — 4 equally-weighted pillars, null-exclusion averaging.',
                'published_at' => now(),
            ],
        );
    }
}
