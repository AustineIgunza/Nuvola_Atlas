<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AdminApiKeyTest extends TestCase
{
    public function test_non_admin_cannot_mint_api_keys(): void
    {
        $editor = User::factory()->editor()->create();
        $partner = User::factory()->partner()->create();

        $this->actingAs($editor)
            ->postJson('/api/v1/admin/api-keys', [
                'user_id' => $partner->id,
                'name' => 'partner read',
                'abilities' => ['api:read'],
            ])
            ->assertForbidden();
    }

    public function test_admin_can_mint_partner_key_and_token_returned_once(): void
    {
        $admin = $this->adminWithTwoFactor();
        $partner = User::factory()->partner()->create();

        $response = $this->actingAs($admin)
            ->postJson('/api/v1/admin/api-keys', [
                'user_id' => $partner->id,
                'name' => 'pilot partner — readonly',
                'abilities' => ['api:read'],
                'expires_in_days' => 90,
            ])
            ->assertCreated()
            ->assertJsonStructure(['token', 'data' => ['id', 'name', 'abilities', 'expires_at', 'user']]);

        $token = $response->json('token');
        $this->assertNotEmpty($token, 'plaintext token must be returned at mint time');

        // The plaintext form is `<id>|<random>`; verify it points at the mint
        // record and at the partner user.
        $record = PersonalAccessToken::findToken($token);
        $this->assertNotNull($record);
        $this->assertSame($partner->id, $record->tokenable_id);
        $this->assertSame(['api:read'], $record->abilities);
        $this->assertNotNull($record->expires_at);
    }

    public function test_invalid_ability_is_rejected(): void
    {
        $admin = $this->adminWithTwoFactor();
        $partner = User::factory()->partner()->create();

        $this->actingAs($admin)
            ->postJson('/api/v1/admin/api-keys', [
                'user_id' => $partner->id,
                'name' => 'bad',
                'abilities' => ['api:read', 'wildcard:*'],
            ])
            ->assertUnprocessable();
    }

    public function test_admin_can_list_and_revoke_keys(): void
    {
        $admin = $this->adminWithTwoFactor();
        $partner = User::factory()->partner()->create();

        $token = $partner->createToken('p1', ['api:read'])->accessToken;

        $list = $this->actingAs($admin)->getJson('/api/v1/admin/api-keys')->assertOk();
        $this->assertGreaterThan(0, count($list->json('data')));

        $this->actingAs($admin)
            ->deleteJson("/api/v1/admin/api-keys/{$token->id}")
            ->assertOk();

        $this->assertNull(PersonalAccessToken::find($token->id));
    }

    private function adminWithTwoFactor(): User
    {
        return User::factory()->create([
            'role' => Role::Admin,
            'email_two_factor_enabled_at' => now(),
        ]);
    }
}
