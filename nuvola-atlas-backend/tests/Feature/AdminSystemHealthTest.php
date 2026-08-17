<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class AdminSystemHealthTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // The endpoint caches for 10s; every test here wants a fresh reading.
        Cache::forget('admin.system_health.v1');
    }

    private function adminWithTwoFactor(): User
    {
        return User::factory()->create([
            'role' => Role::Admin,
            'email_two_factor_enabled_at' => now(),
        ]);
    }

    /** @return array<string, array<string, mixed>> */
    private function checksByKey(array $data): array
    {
        return collect($data['checks'])->keyBy('key')->all();
    }

    public function test_endpoint_reports_real_database_and_migration_state(): void
    {
        $admin = $this->adminWithTwoFactor();

        $data = $this->actingAs($admin)
            ->getJson('/api/v1/admin/system-health')
            ->assertOk()
            ->assertJsonStructure(['data' => [
                'measured_at',
                'checks' => [['key', 'status', 'value', 'unit', 'detail']],
            ]])
            ->json('data');

        $checks = $this->checksByKey($data);

        // The suite runs against a migrated Postgres, so these are knowable.
        $this->assertSame('ok', $checks['database']['status']);
        $this->assertIsFloat($checks['database']['value']);
        $this->assertGreaterThan(0, $checks['database']['value']);

        $this->assertSame('ok', $checks['migrations']['status']);
        $this->assertSame(0, $checks['migrations']['value']);

        $this->assertSame('ok', $checks['queue_depth']['status']);
        $this->assertSame(0, $checks['queue_depth']['value']);
    }

    public function test_unmeasurable_values_report_not_monitored_and_never_a_number(): void
    {
        $admin = $this->adminWithTwoFactor();

        $checks = $this->checksByKey(
            $this->actingAs($admin)->getJson('/api/v1/admin/system-health')->json('data')
        );

        // The whole point of the task: the panel used to print "99.98%" and
        // "0.1%" for these. Neither is obtainable from inside this process.
        foreach (['uptime_30d', 'error_rate_24h'] as $key) {
            $this->assertSame('not_monitored', $checks[$key]['status'], $key);
            $this->assertNull($checks[$key]['value'], $key);
        }
    }

    public function test_ingestion_check_does_not_claim_a_batch_that_never_arrived(): void
    {
        $admin = $this->adminWithTwoFactor();

        $checks = $this->checksByKey(
            $this->actingAs($admin)->getJson('/api/v1/admin/system-health')->json('data')
        );

        $this->assertSame('degraded', $checks['last_ingestion']['status']);
        $this->assertNull($checks['last_ingestion']['value']);
        $this->assertSame('No accepted batch has ever arrived.', $checks['last_ingestion']['detail']);
    }

    public function test_endpoint_is_admin_only(): void
    {
        $this->getJson('/api/v1/admin/system-health')->assertUnauthorized();

        $viewer = User::factory()->create(['role' => Role::Viewer]);
        $this->actingAs($viewer)->getJson('/api/v1/admin/system-health')->assertForbidden();
    }

    public function test_admin_without_two_factor_is_refused(): void
    {
        $admin = User::factory()->create([
            'role' => Role::Admin,
            'email_two_factor_enabled_at' => null,
        ]);

        $this->actingAs($admin)->getJson('/api/v1/admin/system-health')->assertForbidden();
    }
}
