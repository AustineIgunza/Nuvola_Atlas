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
        // Post-2026-07-25 schema swap: pillars are derived from indicators
        // at read time. Every indicator gets a plausible value so the
        // ScoreCalculator sees the same shape production does.
        $social = fake()->numberBetween(30, 95);
        $safety = fake()->numberBetween(30, 95);
        $density = fake()->numberBetween(30, 95);
        $infra = fake()->numberBetween(30, 95);

        $indicators = [
            'indicator_healthcare_access' => $social,
            'indicator_education_access' => $social,
            'indicator_digital_connectivity' => $social,
            'indicator_crime_rates' => $safety,
            'indicator_emergency_response_access' => $safety,
            'indicator_disaster_exposure' => $safety,
            'indicator_population_density' => $density,
            'indicator_congestion' => $density,
            'indicator_housing_pressure' => $density,
            'indicator_road_quality' => $infra,
            'indicator_energy_reliability' => $infra,
            'indicator_food_risk' => $infra,
            'indicator_waste_management' => $infra,
        ];

        return array_merge([
            'id' => fake()->slug(2),
            'name' => fake()->city(),
            'score' => (int) round(($social + $safety + $density + $infra) / 4),
            'last_sync_min' => fake()->numberBetween(1, 30),
        ], $indicators);
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
