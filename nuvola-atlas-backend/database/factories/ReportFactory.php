<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Report;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReportFactory extends Factory
{
    protected $model = Report::class;

    public function definition(): array
    {
        return [
            'id' => 'r'.fake()->unique()->randomNumber(5),
            'title' => fake()->sentence(),
            'zone_id' => null,
            'date' => fake()->date(),
            'status' => fake()->randomElement(['published', 'review', 'draft']),
            'author' => fake()->name(),
            'size_bytes' => fake()->numberBetween(100000, 5000000),
            'format' => 'PDF',
        ];
    }
}
