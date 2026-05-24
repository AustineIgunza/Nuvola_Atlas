<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Project;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        return [
            'id' => 'p'.fake()->unique()->randomNumber(5),
            'name' => fake()->sentence(3),
            'zone_id' => Zone::factory(),
            'agency' => fake()->randomElement(['KeNHA', 'KURA', 'KPLC', 'KETRACO', 'ICTA']),
            'type' => fake()->randomElement(['road', 'energy', 'grid']),
            'status' => fake()->randomElement(['active', 'stalled', 'planned']),
            'progress' => fake()->numberBetween(0, 100),
            'budget' => 'KES '.fake()->numberBetween(50, 2000).'M',
            'started' => fake()->dateTimeBetween('-1 year', 'now'),
            'eta' => fake()->dateTimeBetween('now', '+1 year'),
            'milestones' => [
                ['date' => '2025-01-15', 'label' => 'Groundbreaking', 'done' => true],
                ['date' => '2026-06-30', 'label' => 'Completion', 'done' => false],
            ],
            'marker_lon' => fake()->randomFloat(4, 36.72, 36.94),
            'marker_lat' => fake()->randomFloat(4, -1.38, -1.22),
        ];
    }
}
