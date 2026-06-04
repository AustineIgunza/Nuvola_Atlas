<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    public function test_can_sign_in(): void
    {
        User::create([
            'name' => 'Test User',
            'email' => 'test@nuvola.ke',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/sign-in', [
            'email' => 'test@nuvola.ke',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user' => ['name', 'email']]);
    }

    public function test_sign_in_fails_with_wrong_password(): void
    {
        User::create([
            'name' => 'Test User',
            'email' => 'test@nuvola.ke',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/sign-in', [
            'email' => 'test@nuvola.ke',
            'password' => 'wrongpass',
        ]);

        $response->assertUnauthorized();
    }

    public function test_sign_in_validation_fails(): void
    {
        $response = $this->postJson('/api/v1/auth/sign-in', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }
}
