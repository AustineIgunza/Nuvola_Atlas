<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\AuditLog;
use App\Models\Partner;
use App\Models\Report;
use App\Models\User;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    public function test_metrics_endpoint_returns_expected_shape(): void
    {
        $admin = $this->adminWithTwoFactor();

        // Seed a small mix of entities so the counts aren't all zero.
        Partner::factory()->count(2)->create();
        Report::factory()->count(3)->create();

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/metrics')
            ->assertOk()
            ->assertJsonStructure(['data' => [
                'users_total', 'partners_total', 'reports_total',
                'alerts_unread', 'audit_events_last_24h',
                'api_keys_active', 'admins_total', 'admins_with_two_factor',
                'generated_at',
            ]]);

        $data = $response->json('data');
        $this->assertGreaterThanOrEqual(2, $data['partners_total']);
        $this->assertGreaterThanOrEqual(3, $data['reports_total']);
        $this->assertGreaterThanOrEqual(1, $data['admins_total']);
        $this->assertGreaterThanOrEqual(1, $data['admins_with_two_factor']);
    }

    public function test_audit_endpoint_returns_paginated_feed(): void
    {
        $admin = $this->adminWithTwoFactor();

        AuditLog::create(['action' => 'test.event_a', 'actor_id' => $admin->id]);
        AuditLog::create(['action' => 'test.event_b', 'actor_id' => $admin->id]);

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/audit')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta' => ['next_cursor', 'prev_cursor', 'per_page']]);

        $this->assertGreaterThanOrEqual(2, count($response->json('data')));

        // Action filter narrows the feed.
        $filtered = $this->actingAs($admin)
            ->getJson('/api/v1/admin/audit?action=test.event_a')
            ->assertOk();
        foreach ($filtered->json('data') as $row) {
            $this->assertSame('test.event_a', $row['action']);
        }
    }

    public function test_users_endpoint_returns_role_and_2fa_badge(): void
    {
        $admin = $this->adminWithTwoFactor();
        User::factory()->editor()->create(['email' => 'ed@example.test']);
        User::factory()->partner()->create(['email' => 'pa@example.test']);

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/users')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta' => ['current_page', 'last_page', 'per_page', 'total']]);

        $rows = collect($response->json('data'));
        $this->assertTrue($rows->contains(fn ($r) => $r['email'] === 'ed@example.test' && $r['role'] === 'editor'));
        $this->assertTrue($rows->contains(fn ($r) => $r['email'] === 'pa@example.test' && $r['role'] === 'partner'));

        // The admin we acted as should have two_factor_enabled = true.
        $adminRow = $rows->firstWhere('email', $admin->email);
        $this->assertNotNull($adminRow);
        $this->assertTrue($adminRow['two_factor_enabled']);
    }

    public function test_non_admin_cannot_reach_admin_endpoints(): void
    {
        $editor = User::factory()->editor()->create();

        $this->actingAs($editor)->getJson('/api/v1/admin/metrics')->assertForbidden();
        $this->actingAs($editor)->getJson('/api/v1/admin/audit')->assertForbidden();
        $this->actingAs($editor)->getJson('/api/v1/admin/users')->assertForbidden();
        $this->actingAs($editor)->patchJson('/api/v1/admin/users/1', ['role' => 'admin'])->assertForbidden();
    }

    public function test_admin_can_change_another_users_role_and_audit_logs_it(): void
    {
        $admin = $this->adminWithTwoFactor();
        $viewer = User::factory()->create(['role' => Role::Viewer]);

        $this->actingAs($admin)
            ->patchJson("/api/v1/admin/users/{$viewer->id}", ['role' => 'editor'])
            ->assertOk()
            ->assertJsonPath('data.role', 'editor');

        $this->assertSame('editor', $viewer->refresh()->role()->value);

        $row = AuditLog::where('action', 'user.role_changed')->latest('id')->first();
        $this->assertNotNull($row);
        $this->assertSame('viewer', $row->before['role'] ?? null);
        $this->assertSame('editor', $row->after['role'] ?? null);
    }

    public function test_admin_cannot_change_own_role(): void
    {
        $admin = $this->adminWithTwoFactor();

        $this->actingAs($admin)
            ->patchJson("/api/v1/admin/users/{$admin->id}", ['role' => 'viewer'])
            ->assertForbidden();
    }

    public function test_audit_volume_returns_thirty_day_series_with_zero_fill(): void
    {
        $admin = $this->adminWithTwoFactor();

        // Two events today, one 5 days ago. Everything else should be zero.
        AuditLog::create(['action' => 'spark.today_a', 'actor_id' => $admin->id]);
        AuditLog::create(['action' => 'spark.today_b', 'actor_id' => $admin->id]);
        AuditLog::create([
            'action' => 'spark.five_days_ago',
            'actor_id' => $admin->id,
            'created_at' => now()->subDays(5),
        ]);

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/metrics/audit-volume')
            ->assertOk()
            ->assertJsonStructure(['data' => [
                'series' => [['date', 'count']],
                'window_days', 'total', 'generated_at',
            ]]);

        $data = $response->json('data');
        $this->assertSame(30, count($data['series']));
        $this->assertSame(30, $data['window_days']);
        $this->assertGreaterThanOrEqual(3, $data['total']);

        // Today's bucket is the last entry and contains at least our 2 events.
        $today = end($data['series']);
        $this->assertSame(now()->toDateString(), $today['date']);
        $this->assertGreaterThanOrEqual(2, $today['count']);

        // Series is sorted oldest → newest.
        $dates = array_column($data['series'], 'date');
        $sorted = $dates;
        sort($sorted);
        $this->assertSame($sorted, $dates);
    }

    public function test_audit_csv_export_returns_csv_attachment(): void
    {
        $admin = $this->adminWithTwoFactor();
        AuditLog::create(['action' => 'export.event_x', 'actor_id' => $admin->id]);

        $response = $this->actingAs($admin)
            ->get('/api/v1/admin/audit/export?action=export.event_x')
            ->assertOk();

        $response->assertHeader('Content-Type', 'text/csv; charset=utf-8');
        $this->assertStringContainsString('attachment; filename="nuvola-audit-', $response->headers->get('Content-Disposition'));

        $body = $response->streamedContent();
        $this->assertStringStartsWith('id,created_at,action,', $body);
        $this->assertStringContainsString('export.event_x', $body);
    }

    private function adminWithTwoFactor(): User
    {
        return User::factory()->create([
            'role' => Role::Admin,
            'email_two_factor_enabled_at' => now(),
        ]);
    }
}
