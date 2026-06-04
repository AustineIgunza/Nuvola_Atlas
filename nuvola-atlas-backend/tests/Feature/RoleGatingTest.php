<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class RoleGatingTest extends TestCase
{
    public function test_viewer_cannot_mark_all_alerts_read(): void
    {
        $viewer = User::factory()->viewer()->create();

        $response = $this->actingAs($viewer)->postJson('/api/v1/alerts/mark-all-read');

        $response->assertForbidden();
    }

    public function test_partner_cannot_create_report(): void
    {
        $partner = User::factory()->partner()->create();

        $response = $this->actingAs($partner)->postJson('/api/v1/reports', [
            'title' => 'Partner Report',
        ]);

        $response->assertForbidden();
    }

    public function test_editor_can_create_report(): void
    {
        $editor = User::factory()->editor()->create();

        $response = $this->actingAs($editor)->postJson('/api/v1/reports', [
            'title' => 'Editor Report',
        ]);

        $response->assertCreated();
    }

    public function test_admin_can_mark_all_alerts_read(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/v1/alerts/mark-all-read');

        $response->assertOk()->assertJsonPath('ok', true);
    }

    public function test_me_endpoint_returns_role_and_verification_state(): void
    {
        $user = User::factory()->editor()->create();

        $response = $this->actingAs($user)->getJson('/api/v1/auth/me');

        $response->assertOk()
            ->assertJsonPath('role', 'editor')
            ->assertJsonPath('email_verified', true);
    }

    public function test_me_reports_unverified_email_when_factory_state_unverified(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user)->getJson('/api/v1/auth/me');

        $response->assertOk()->assertJsonPath('email_verified', false);
    }
}
