<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\DataIngestionLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use App\Support\Pillars;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Support\PillarSeeding;
use Tests\TestCase;

/**
 * `/api/v1/ingest` is the one route that authenticates on a shared secret
 * rather than on a user. That makes two failure modes worth pinning:
 *
 *  1. A logged-in user must not be able to reach it. If `auth:sanctum` ever
 *     drifts onto this route, any partner with an API key inherits write
 *     access to every zone's pillar values.
 *  2. A rejected request must not echo anything about the expected secret.
 *
 * The signature mechanics themselves live in IngestContractTest.
 */
class IngestAccessTest extends TestCase
{
    private const SECRET = 'test-internal-secret-value-that-is-long-enough-000';

    protected function setUp(): void
    {
        parent::setUp();
        config()->set('services.ingest.secret', self::SECRET);
    }

    private function seedZone(string $id = 'access-zone'): void
    {
        $pillars = PillarSeeding::columns(array_fill_keys(Pillars::keys(), 70));
        $cols = implode(', ', array_keys($pillars));
        $vals = implode(', ', array_fill(0, count($pillars), '?'));

        DB::statement(
            "INSERT INTO zones (id, name, score, {$cols}, last_sync_min,
             centroid, created_at, updated_at)
             VALUES (?, ?, ?, {$vals}, 5,
             ST_GeogFromText('POINT(36.82 -1.29)'), now(), now())",
            array_merge([$id, ucfirst($id), 70], array_values($pillars))
        );
    }

    /** @return array<string, mixed> */
    private function payload(string $zoneId = 'access-zone'): array
    {
        return [
            'source' => 'fastapi.daystar',
            'zone_id' => $zoneId,
            'pillars' => ['water_sanitation' => 88],
            'received_at' => now()->toIso8601String(),
        ];
    }

    public function test_route_is_not_behind_sanctum(): void
    {
        $route = collect(Route::getRoutes())->first(
            fn ($r) => $r->uri() === 'api/v1/ingest' && in_array('POST', $r->methods(), true)
        );

        $this->assertNotNull($route, 'POST api/v1/ingest is not registered.');

        $middleware = $route->gatherMiddleware();
        $this->assertContains('internal.secret', $middleware);

        // A user-auth guard here would silently widen the blast radius from
        // "whoever holds the shared secret" to "every authenticated user".
        foreach ($middleware as $name) {
            $this->assertStringNotContainsString('auth:', (string) $name);
        }
    }

    /**
     * @return list<array{0: string}>
     */
    public static function roles(): array
    {
        return [['admin'], ['editor'], ['viewer'], ['partner']];
    }

    #[DataProvider('roles')]
    public function test_a_session_authenticated_user_of_any_role_cannot_ingest(string $role): void
    {
        $this->seedZone();
        $user = $role === 'admin'
            ? User::factory()->create(['role' => Role::Admin, 'email_two_factor_enabled_at' => now()])
            : User::factory()->{$role}()->create();

        $this->actingAs($user)
            ->postJson('/api/v1/ingest', $this->payload())
            ->assertUnauthorized();

        $this->assertSame(0, DataIngestionLog::count());
    }

    public function test_a_sanctum_write_token_does_not_substitute_for_the_secret(): void
    {
        $this->seedZone();
        $partner = User::factory()->partner()->create();
        $token = $partner->createToken('partner write', ['api:read', 'api:write'])->plainTextToken;

        $this->postJson('/api/v1/ingest', $this->payload(), [
            'Authorization' => 'Bearer '.$token,
        ])->assertUnauthorized();

        $this->assertSame(0, DataIngestionLog::count());
    }

    public function test_rejection_body_never_echoes_the_expected_secret(): void
    {
        $this->seedZone();

        $response = $this->postJson('/api/v1/ingest', $this->payload(), [
            'X-Internal-Secret' => 'wrong-secret-entirely',
        ])->assertUnauthorized();

        $body = $response->getContent();
        $this->assertStringNotContainsString(self::SECRET, (string) $body);
        $this->assertStringNotContainsString('wrong-secret-entirely', (string) $body);
    }

    public function test_ingest_is_refused_when_the_secret_is_unconfigured(): void
    {
        $this->seedZone();
        config()->set('services.ingest.secret', '');

        // Fail closed: an unset secret must never mean "no check required".
        $this->postJson('/api/v1/ingest', $this->payload(), [
            'X-Internal-Secret' => '',
        ])->assertStatus(503);

        $this->assertSame(0, DataIngestionLog::count());
    }
}
