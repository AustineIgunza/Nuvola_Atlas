<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthRateLimitTest extends TestCase
{
    public function test_eleventh_sign_in_attempt_from_same_ip_returns_429(): void
    {
        User::create([
            'name' => 'Brute Target',
            'email' => 'target@nuvola.ke',
            'password' => Hash::make('password123'),
        ]);

        $payload = ['email' => 'target@nuvola.ke', 'password' => 'wrongpass'];

        // First 10 attempts are spent on wrong-password tries. Each should
        // return 401 with the Problem+JSON shape the rest of the API uses.
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/v1/auth/sign-in', $payload)
                ->assertUnauthorized();
        }

        // 11th request hits the perMinutes(10, 10) cap.
        $response = $this->postJson('/api/v1/auth/sign-in', $payload);
        $response->assertStatus(429);
        $this->assertSame('application/problem+json', $response->headers->get('Content-Type'));
        $this->assertSame(429, $response->json('status'));
    }

    public function test_throttle_is_scoped_per_ip(): void
    {
        // Burn the budget from one IP, then prove a different IP is still
        // free. Cache is per-app-instance so we just vary REMOTE_ADDR.
        $payload = ['email' => 'nope@nuvola.ke', 'password' => 'x'];

        for ($i = 0; $i < 10; $i++) {
            $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
                ->postJson('/api/v1/auth/sign-in', $payload);
        }

        $blocked = $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
            ->postJson('/api/v1/auth/sign-in', $payload);
        $blocked->assertStatus(429);

        // Same minute, different IP — budget intact.
        $clean = $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.2'])
            ->postJson('/api/v1/auth/sign-in', $payload);
        $this->assertNotSame(429, $clean->status());
    }

    public function test_throttle_covers_forgot_password_endpoint(): void
    {
        // Spamming password-reset email triggers from one IP should be capped
        // by the same limiter, since /forgot-password is in the throttle:auth
        // group.
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/v1/auth/forgot-password', ['email' => "victim{$i}@nuvola.ke"]);
        }

        $response = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'victim-final@nuvola.ke']);
        $response->assertStatus(429);
    }
}
