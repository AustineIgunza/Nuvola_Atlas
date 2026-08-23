<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Zone;
use App\Models\ZoneLayer;
use Illuminate\Database\Eloquent\Factories\Factory;

class ZoneLayerFactory extends Factory
{
    protected $model = ZoneLayer::class;

    public function definition(): array
    {
        return [
            'zone_id' => Zone::factory(),
            'layer_type' => fake()->randomElement(['road_density', 'electricity_access', 'density']),
            'geojson' => [
                'type' => 'FeatureCollection',
                'features' => [
                    [
                        'type' => 'Feature',
                        'properties' => ['name' => 'Test Feature'],
                        'geometry' => [
                            'type' => 'Point',
                            'coordinates' => [36.82, -1.28],
                        ],
                    ],
                ],
            ],
        ];
    }
}
