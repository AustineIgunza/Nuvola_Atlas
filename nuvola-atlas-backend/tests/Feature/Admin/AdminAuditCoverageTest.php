<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Enums\Role;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Every admin mutation must leave an audit row.
 *
 * This used to be a runtime concern: an `audit.write` middleware existed to
 * blanket the admin group. It was never bound to a route, and binding it
 * would have double-written — all eleven mutating admin routes already call
 * `Audit::record` themselves, with the resource and a semantic action name
 * that a generic `route.*` row cannot carry.
 *
 * So the invariant is enforced here instead. A new admin route that forgets
 * to audit fails this test rather than silently going unrecorded, which is
 * the failure mode that matters — audit gaps are invisible in production.
 */
class AdminAuditCoverageTest extends TestCase
{
    /**
     * Mutating admin routes that legitimately write no audit row, with the
     * reason they are exempt. Adding to this list should need an argument.
     *
     * @var array<string, string>
     */
    private const EXEMPT = [
        'App\Http\Controllers\AdminMethodologyController@preview' => 'Scores a hypothetical weight set in memory and mutates nothing.',
    ];

    public function test_every_mutating_admin_route_records_an_audit_row(): void
    {
        $unaudited = [];

        foreach (Route::getRoutes() as $route) {
            if (! str_starts_with($route->uri(), 'api/v1/admin/')) {
                continue;
            }

            if (! array_intersect($route->methods(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                continue;
            }

            $action = $route->getActionName();

            if (array_key_exists($action, self::EXEMPT) || ! str_contains($action, '@')) {
                continue;
            }

            [$class, $method] = explode('@', $action, 2);

            if (! str_contains($this->methodSource($class, $method), 'Audit::record')) {
                $unaudited[] = $route->methods()[0].' /'.$route->uri().' → '.$action;
            }
        }

        $this->assertSame([], $unaudited, sprintf(
            "These admin routes mutate state without writing an audit row:\n%s\n\n".
            'Call Audit::record() in the controller with the resource and a '.
            'semantic action name, or add the route to self::EXEMPT with a reason.',
            implode("\n", $unaudited)
        ));
    }

    public function test_an_admin_mutation_actually_lands_an_audit_row(): void
    {
        $admin = User::factory()->create([
            'role' => Role::Admin,
            'email_two_factor_enabled_at' => now(),
        ]);

        $this->actingAs($admin)->postJson('/api/v1/admin/firms', [
            'name' => 'Audit Trail Capital',
            'slug' => 'audit-trail-'.uniqid(),
            'tier' => 'basic',
        ])->assertCreated();

        $entry = AuditLog::where('action', 'admin.firm.create')->latest('id')->first();

        $this->assertNotNull($entry, 'Creating a firm wrote no audit row.');
        $this->assertSame($admin->id, $entry->actor_id);
        $this->assertSame('Firm', $entry->resource_type);
        $this->assertNotNull($entry->resource_id);
    }

    private function methodSource(string $class, string $method): string
    {
        $reflection = new \ReflectionMethod($class, $method);
        $lines = file((string) $reflection->getFileName());

        if ($lines === false) {
            return '';
        }

        return implode('', array_slice(
            $lines,
            $reflection->getStartLine() - 1,
            $reflection->getEndLine() - $reflection->getStartLine() + 1
        ));
    }
}
