<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Alert;
use App\Models\AuditLog;
use App\Models\User;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    public function test_report_creation_writes_audit_row(): void
    {
        $editor = User::factory()->editor()->create();

        $this->actingAs($editor)->postJson('/api/v1/reports', [
            'title' => 'Audited Report',
        ])->assertCreated();

        $row = AuditLog::where('action', 'report.created')->latest('id')->first();

        $this->assertNotNull($row, 'audit_log row should be created for report.created');
        $this->assertSame($editor->id, $row->actor_id);
        $this->assertSame('Report', $row->resource_type);
        $this->assertSame('Audited Report', $row->after['title'] ?? null);
    }

    public function test_alert_bulk_read_writes_single_audit_row(): void
    {
        $editor = User::factory()->editor()->create();

        Alert::create([
            'id' => 'a-aud-1',
            'severity' => 'low',
            'kind' => 'infra',
            'title' => 'x',
            'body' => 'y',
            'zone_id' => null,
            'read' => false,
        ]);
        Alert::create([
            'id' => 'a-aud-2',
            'severity' => 'low',
            'kind' => 'infra',
            'title' => 'x',
            'body' => 'y',
            'zone_id' => null,
            'read' => false,
        ]);

        $this->actingAs($editor)
            ->postJson('/api/v1/alerts/mark-all-read')
            ->assertOk();

        $rows = AuditLog::where('action', 'alert.bulk_read')->get();
        $this->assertCount(1, $rows, 'bulk read should leave exactly one audit row, not one per record');
        $this->assertSame($editor->id, $rows->first()->actor_id);
        $this->assertSame(2, $rows->first()->after['affected']);
    }

    public function test_sign_in_writes_audit_row(): void
    {
        $user = User::factory()->create(['email' => 'login@example.test']);

        $this->postJson('/api/v1/auth/sign-in', [
            'email' => 'login@example.test',
            'password' => 'password',
        ])->assertOk();

        $row = AuditLog::where('action', 'auth.sign_in')->where('actor_id', $user->id)->first();
        $this->assertNotNull($row);
    }

    public function test_security_headers_present_on_api_response(): void
    {
        $response = $this->getJson('/api/v1/zones');

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
}
