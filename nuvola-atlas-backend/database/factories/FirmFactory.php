<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\FirmTier;
use App\Models\Firm;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Firm>
 */
class FirmFactory extends Factory
{
    protected $model = Firm::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'name' => fake()->company(),
            'slug' => fake()->unique()->slug(3),
            'tier' => FirmTier::Basic,
            'contact_email' => fake()->safeEmail(),
            'contact_name' => fake()->name(),
            'website' => fake()->url(),
            'active' => true,
        ];
    }

    public function basic(): static { return $this->state(['tier' => FirmTier::Basic]); }

    public function deal(): static { return $this->state(['tier' => FirmTier::Deal]); }

    public function sovereign(): static { return $this->state(['tier' => FirmTier::Sovereign]); }
}
