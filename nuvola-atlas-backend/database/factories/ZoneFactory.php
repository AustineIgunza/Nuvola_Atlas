<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Zone;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\DB;

class ZoneFactory extends Factory
{
    protected $model = Zone::class;

    public function definition(): array
    {
        $social = fake()->numberBetween(30, 95);
        $safety = fake()->numberBetween(30, 95);
        $density = fake()->numberBetween(30, 95);
        $infra = fake()->numberBetween(30, 95);

        return [
            'id' => fake()->slug(2),
            'name' => fake()->city(),
            'score' => (int) round(($social + $safety + $density + $infra) / 4),
            'pillar_social' => $social,
            'pillar_safety' => $safety,
            'pillar_density' => $density,
            'pillar_infra' => $infra,
            'delta_social' => fake()->numberBetween(-5, 5),
            'delta_safety' => fake()->numberBetween(-5, 5),
            'delta_density' => fake()->numberBetween(-5, 5),
            'delta_infra' => fake()->numberBetween(-5, 5),
            'last_sync_min' => fake()->numberBetween(1, 30),
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Zone $zone) {
            // Nairobi-area coordinates
            $lon = fake()->randomFloat(4, 36.72, 36.94);
            $lat = fake()->randomFloat(4, -1.38, -1.22);

            DB::statement(
                "UPDATE zones SET centroid = ST_MakePoint(?, ?)::geography WHERE id = ?",
                [$lon, $lat, $zone->id]
            );
        });
    }
}
