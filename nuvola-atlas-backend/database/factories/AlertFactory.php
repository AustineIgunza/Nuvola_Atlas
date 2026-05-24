<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Alert;
use Illuminate\Database\Eloquent\Factories\Factory;

class AlertFactory extends Factory
{
    protected $model = Alert::class;

    public function definition(): array
    {
        return [
            'id' => 'a'.fake()->unique()->randomNumber(5),
            'severity' => fake()->randomElement(['high', 'medium', 'low']),
            'kind' => fake()->randomElement(['infra', 'vitality', 'esia', 'system', 'partner']),
            'title' => fake()->sentence(),
            'body' => fake()->paragraph(),
            'zone_id' => null,
            'read' => false,
        ];
    }
}
