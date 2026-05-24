<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Activity;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Factories\Factory;

class ActivityFactory extends Factory
{
    protected $model = Activity::class;

    public function definition(): array
    {
        return [
            'id' => 'act'.fake()->unique()->randomNumber(5),
            'zone_id' => Zone::factory(),
            'kind' => fake()->randomElement(['road', 'grid', 'esia', 'density']),
            'text' => fake()->sentence(),
            'source' => fake()->randomElement(['KeNHA', 'KURA', 'KPLC', 'KETRACO', 'KNBS', 'NEMA']),
        ];
    }
}
