<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ChatConversation;
use App\Models\User;
use App\Services\Chat\SqlExecutor;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The grants on the `pgsql_chat` role are the primary control on what
 * LLM-authored SQL can read. SqlGuard is defence in depth on top of them,
 * so these tests deliberately bypass the guard and talk to the connection
 * directly — if the guard were ever bypassed, this is what would be left.
 */
class ChatReadOnlyRoleTest extends TestCase
{
    private function seedUser(string $email = 'user@example.com'): User
    {
        return User::create([
            'name' => 'Test User',
            'email' => $email,
            'password' => bcrypt('password'),
            'role' => 'viewer',
        ]);
    }

    public function test_the_chat_connection_is_not_the_primary_database_user(): void
    {
        $this->assertNotSame(
            config('database.connections.pgsql.username'),
            config('database.connections.pgsql_chat.username'),
            'The chat role must be a distinct, restricted role — aliasing it to the '
                .'app user silently disables every grant these tests rely on.'
        );
    }

    public function test_the_chat_role_cannot_read_the_users_table(): void
    {
        $this->seedUser();

        $this->expectException(QueryException::class);
        DB::connection('pgsql_chat')->select('SELECT email, password FROM users');
    }

    public function test_the_chat_role_can_read_the_non_identifying_view(): void
    {
        // Row counts are not assertable here: RefreshDatabase holds the
        // seeded user in an open transaction on the primary connection, and
        // pgsql_chat is a different session. The grant is what is under test.
        $rows = DB::connection('pgsql_chat')->select('SELECT count(*) AS n FROM chat_user_stats');

        $this->assertCount(1, $rows);
    }

    public function test_the_non_identifying_view_exposes_no_route_to_personal_data(): void
    {
        $columns = DB::connection('pgsql_chat')->select(
            'SELECT column_name FROM information_schema.columns
             WHERE table_name = ? ORDER BY ordinal_position',
            ['chat_user_stats']
        );

        $this->assertSame(
            ['id', 'role', 'created_at'],
            array_map(fn ($column) => $column->column_name, $columns)
        );
    }

    public function test_the_chat_role_cannot_write(): void
    {
        $this->seedUser();

        $this->expectException(QueryException::class);
        DB::connection('pgsql_chat')->statement("UPDATE zones SET score = 0 WHERE id = 'westlands'");
    }

    public function test_the_chat_role_cannot_read_a_table_outside_the_allowlist(): void
    {
        $this->expectException(QueryException::class);
        DB::connection('pgsql_chat')->select('SELECT * FROM audit_logs');
    }

    public function test_an_unconfigured_read_only_role_fails_closed(): void
    {
        config()->set('database.connections.pgsql_chat.username', null);

        $this->assertFalse(SqlExecutor::isConfigured());

        $result = (new SqlExecutor)->run('SELECT 1');

        $this->assertFalse($result['ok']);
        $this->assertSame([], $result['rows']);
    }

    public function test_a_read_only_role_aliased_to_the_app_user_fails_closed(): void
    {
        config()->set(
            'database.connections.pgsql_chat.username',
            config('database.connections.pgsql.username')
        );

        $this->assertFalse(SqlExecutor::isConfigured());
    }

    public function test_send_returns_503_when_the_read_only_role_is_missing(): void
    {
        config()->set('ai.gateway.api_key', 'sk-test');
        config()->set('database.connections.pgsql_chat.username', null);

        $user = $this->seedUser();
        Sanctum::actingAs($user);
        $conversation = ChatConversation::create(['user_id' => $user->id, 'title' => 't']);

        $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages", ['prompt' => 'hello'])
            ->assertStatus(503);
    }
}
