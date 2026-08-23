<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Zone;
use App\Services\ScoreCalculator;
use App\Support\Pillars;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\DB;

class ZoneFactory extends Factory
{
    protected $model = Zone::class;

    public function definition(): array
    {
        $pillars = [];
        foreach (Pillars::keys() as $key) {
            $pillars[Pillars::column($key)] = fake()->numberBetween(30, 95);
        }

        // Scored through the production calculator so a factory zone can never
        // carry a score its own pillar values would not produce.
        $score = (new ScoreCalculator)->calculateScore((new Zone)->forceFill($pillars));

        return array_merge([
            'id' => fake()->slug(2),
            'name' => fake()->city(),
            'score' => $score,
            'last_sync_min' => fake()->numberBetween(1, 30),
        ], $pillars);
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Zone $zone) {
            // Nairobi-area coordinates
            $lon = fake()->randomFloat(4, 36.72, 36.94);
            $lat = fake()->randomFloat(4, -1.38, -1.22);

            DB::statement(
                'UPDATE zones SET centroid = ST_MakePoint(?, ?)::geography WHERE id = ?',
                [$lon, $lat, $zone->id]
            );
        });
    }
}
