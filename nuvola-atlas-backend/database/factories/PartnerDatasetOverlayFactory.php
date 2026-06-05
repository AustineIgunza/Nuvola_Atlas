<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Partner;
use App\Models\PartnerDatasetOverlay;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PartnerDatasetOverlay>
 */
class PartnerDatasetOverlayFactory extends Factory
{
    public function definition(): array
    {
        return [
            'partner_id' => Partner::factory(),
            'name' => fake()->words(2, true),
            'payload' => ['kind' => 'geojson', 'features' => []],
        ];
    }
}
