<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Mail\TwoFactorCodeMail;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TwoFactorTest extends TestCase
{
    public function test_email_start_mails_a_code_and_seeds_cache(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'a@example.test']);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/auth/2fa/email/start')
            ->assertOk()
            ->assertJsonStructure(['message', 'email_hint', 'expires_in_seconds']);

        Mail::assertSent(TwoFactorCodeMail::class, fn ($m) => $m->hasTo('a@example.test'));
        $this->assertNotNull(Cache::get('auth.two_factor_enrol:'.$user->id));
        $this->assertStringEndsWith('@example.test', $response->json('email_hint'));
    }

    public function test_email_confirm_flips_enabled_when_code_matches(): void
    {
        Mail::fake();
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/v1/auth/2fa/email/start')->assertOk();
        $code = Cache::get('auth.two_factor_enrol:'.$user->id);
        $this->assertIsString($code);

        $this->actingAs($user)
            ->postJson('/api/v1/auth/2fa/email/confirm', ['code' => $code])
            ->assertOk();

        $user->refresh();
        $this->assertNotNull($user->email_two_factor_enabled_at);
        $this->assertTrue($user->hasTwoFactorEnabled());

        // Cache::pull consumed the code — replays must fail.
        $this->actingAs($user)
            ->postJson('/api/v1/auth/2fa/email/confirm', ['code' => $code])
            ->assertUnprocessable();
    }

    public function test_email_confirm_rejects_wrong_code(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $this->actingAs($user)->postJson('/api/v1/auth/2fa/email/start')->assertOk();

        $this->actingAs($user)
            ->postJson('/api/v1/auth/2fa/email/confirm', ['code' => '000000'])
            ->assertUnprocessable();

        $user->refresh();
        $this->assertNull($user->email_two_factor_enabled_at);
    }

    public function test_resend_is_rate_limited_to_once_per_minute(): void
    {
        Mail::fake();
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/v1/auth/2fa/email/start')->assertOk();
        $this->actingAs($user)->postJson('/api/v1/auth/2fa/email/start')->assertStatus(429);
    }

    public function test_sign_in_with_2fa_mails_code_and_returns_challenge(): void
    {
        Mail::fake();
        $user = $this->makeUserWithEmailTwoFactor();

        $response = $this->postJson('/api/v1/auth/sign-in', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();

        $response->assertJson([
            'requires_two_factor' => true,
            'channel' => 'email',
        ]);
        $response->assertJsonStructure(['challenge_token', 'email_hint']);
        $this->assertNull($response->json('token'));

        Mail::assertSent(TwoFactorCodeMail::class, fn ($m) => $m->hasTo($user->email));
    }

    public function test_verify_with_correct_code_issues_token(): void
    {
        Mail::fake();
        $user = $this->makeUserWithEmailTwoFactor();

        $challenge = $this->postJson('/api/v1/auth/sign-in', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('challenge_token');

        $code = Cache::get('auth.two_factor_challenge:'.hash('sha256', $challenge))['code'];

        $this->postJson('/api/v1/auth/2fa/verify', [
            'challenge_token' => $challenge,
            'code' => $code,
        ])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'role']]);
    }

    public function test_verify_with_wrong_code_keeps_challenge_alive(): void
    {
        Mail::fake();
        $user = $this->makeUserWithEmailTwoFactor();
        $challenge = $this->postJson('/api/v1/auth/sign-in', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('challenge_token');

        $this->postJson('/api/v1/auth/2fa/verify', [
            'challenge_token' => $challenge,
            'code' => '000000',
        ])->assertUnprocessable();

        // Real code still works after the bad attempt.
        $code = Cache::get('auth.two_factor_challenge:'.hash('sha256', $challenge))['code'];
        $this->postJson('/api/v1/auth/2fa/verify', [
            'challenge_token' => $challenge,
            'code' => $code,
        ])->assertOk();
    }

    public function test_admin_without_2fa_is_blocked_from_admin_routes(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/api-keys')
            ->assertForbidden()
            ->assertJson(['two_factor_required' => true]);
    }

    public function test_admin_with_2fa_can_reach_admin_routes(): void
    {
        $admin = $this->makeUserWithEmailTwoFactor(['role' => \App\Enums\Role::Admin]);

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/api-keys')
            ->assertOk();
    }

    private function makeUserWithEmailTwoFactor(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'email_two_factor_enabled_at' => now(),
        ], $overrides));
    }
}
