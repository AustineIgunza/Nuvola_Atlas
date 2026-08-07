<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthRateLimitTest extends TestCase
{
    public function test_repeated_attempts_on_one_account_hit_the_email_bucket(): void
    {
        User::create([
            'name' => 'Brute Target',
            'email' => 'target@nuvola.ke',
            'password' => Hash::make('password123'),
        ]);

        $payload = ['email' => 'target@nuvola.ke', 'password' => 'wrongpass'];

        // The (email + IP) bucket allows 20 per 10 minutes; each of those is
        // a plain 401 with the Problem+JSON shape the rest of the API uses.
        for ($i = 0; $i < 20; $i++) {
            $this->postJson('/api/v1/auth/sign-in', $payload)
                ->assertUnauthorized();
        }

        $response = $this->postJson('/api/v1/auth/sign-in', $payload);
        $response->assertStatus(429);
        $this->assertSame('application/problem+json', $response->headers->get('Content-Type'));
        $this->assertSame(429, $response->json('status'));
    }

    public function test_email_bucket_is_scoped_per_ip(): void
    {
        // Burn one account's budget from one IP, then prove the same account
        // is still reachable from another — carrier NAT must not let one
        // client lock an account out globally.
        $payload = ['email' => 'nope@nuvola.ke', 'password' => 'wrongpass'];

        for ($i = 0; $i < 20; $i++) {
            $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
                ->postJson('/api/v1/auth/sign-in', $payload);
        }

        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
            ->postJson('/api/v1/auth/sign-in', $payload)
            ->assertStatus(429);

        $clean = $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.2'])
            ->postJson('/api/v1/auth/sign-in', $payload);
        $this->assertNotSame(429, $clean->status());
    }

    public function test_ip_ceiling_stops_one_host_spraying_many_addresses(): void
    {
        // Varying the email dodges the per-account bucket entirely, so this
        // is the only limit standing between one host and unlimited
        // password-reset mail. 50 per 10 minutes per IP.
        for ($i = 0; $i < 50; $i++) {
            $this->postJson('/api/v1/auth/forgot-password', ['email' => "victim{$i}@nuvola.ke"]);
        }

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'victim-final@nuvola.ke'])
            ->assertStatus(429);
    }
}
