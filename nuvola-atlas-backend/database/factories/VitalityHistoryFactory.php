<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\VitalityHistory;
use Illuminate\Database\Eloquent\Factories\Factory;

class VitalityHistoryFactory extends Factory
{
    protected $model = VitalityHistory::class;

    public function definition(): array
    {
        return [
            'month' => fake()->monthName()." '".fake()->year(),
            'overall_avg' => fake()->randomFloat(1, 50, 80),
        ];
    }
}
