<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Crypt;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class TwoFactorTest extends TestCase
{
    public function test_enable_returns_secret_and_recovery_codes(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/auth/2fa/enable')
            ->assertOk()
            ->assertJsonStructure(['secret', 'otpauth_uri', 'recovery_codes']);

        $this->assertCount(8, $response->json('recovery_codes'));
        $this->assertStringStartsWith('otpauth://totp/', $response->json('otpauth_uri'));

        $user->refresh();
        $this->assertNotNull($user->two_factor_secret);
        $this->assertNull($user->two_factor_confirmed_at, 'secret is set but not yet confirmed');
    }

    public function test_confirm_flips_two_factor_on(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->postJson('/api/v1/auth/2fa/enable')->assertOk();

        $user->refresh();
        $g2fa = new Google2FA;
        $valid = $g2fa->getCurrentOtp(Crypt::decryptString($user->two_factor_secret));

        $this->actingAs($user)
            ->postJson('/api/v1/auth/2fa/confirm', ['code' => $valid])
            ->assertOk();

        $user->refresh();
        $this->assertNotNull($user->two_factor_confirmed_at);
        $this->assertTrue($user->hasTwoFactorEnabled());
    }

    public function test_sign_in_with_2fa_returns_challenge_not_token(): void
    {
        $user = $this->makeUserWithTwoFactor();

        $response = $this->postJson('/api/v1/auth/sign-in', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();

        $response->assertJson(['requires_two_factor' => true]);
        $response->assertJsonStructure(['challenge_token']);
        $this->assertNull($response->json('token'), 'no access token until the TOTP code is verified');
    }

    public function test_verify_with_correct_code_issues_token(): void
    {
        $user = $this->makeUserWithTwoFactor();

        $challenge = $this->postJson('/api/v1/auth/sign-in', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('challenge_token');

        $code = (new Google2FA)->getCurrentOtp(Crypt::decryptString($user->two_factor_secret));

        $this->postJson('/api/v1/auth/2fa/verify', [
            'challenge_token' => $challenge,
            'code' => $code,
        ])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'role']]);
    }

    public function test_verify_with_recovery_code_consumes_it(): void
    {
        $user = $this->makeUserWithTwoFactor();
        $recoveryCode = $user->twoFactorRecoveryCodes()[0];

        $challenge = $this->postJson('/api/v1/auth/sign-in', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('challenge_token');

        $this->postJson('/api/v1/auth/2fa/verify', [
            'challenge_token' => $challenge,
            'code' => $recoveryCode,
        ])->assertOk();

        // Reusing the same recovery code must fail next time.
        $user->refresh();
        $this->assertNotContains($recoveryCode, $user->twoFactorRecoveryCodes());
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
        $admin = $this->makeUserWithTwoFactor(['role' => \App\Enums\Role::Admin]);

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/api-keys')
            ->assertOk();
    }

    private function makeUserWithTwoFactor(array $overrides = []): User
    {
        $g2fa = new Google2FA;
        $secret = $g2fa->generateSecretKey();
        $codes = ['recovery-aaa-111', 'recovery-bbb-222', 'recovery-ccc-333'];

        return User::factory()->create(array_merge([
            'two_factor_secret' => Crypt::encryptString($secret),
            'two_factor_recovery_codes' => Crypt::encryptString(json_encode($codes)),
            'two_factor_confirmed_at' => now(),
        ], $overrides));
    }
}
