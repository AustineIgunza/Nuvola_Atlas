<?php

declare(strict_types=1);

namespace App\Services\Chat;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class SqlExecutor
{
    /**
     * Whether the chat pipeline has a genuinely restricted role to run on.
     *
     * Equal to the primary credentials counts as unconfigured: pointing
     * DB_CHAT_RO_USER at the owning user is how the restriction gets
     * quietly undone, and it is indistinguishable from working until
     * someone reads a password hash out of the assistant.
     */
    public static function isConfigured(): bool
    {
        $user = config('database.connections.pgsql_chat.username');

        if (! is_string($user) || $user === '') {
            return false;
        }

        return $user !== config('database.connections.pgsql.username');
    }

    /**
     * Run the guarded SQL on the read-only connection. Errors are logged
     * with full detail server-side but a sanitized message is returned to
     * the caller — pg errors can leak column names / hint at data shape,
     * which we don't hand to the LLM (or the client).
     *
     * @return array{ok: bool, rows: array<int, array<string, mixed>>, count: int, error: string|null}
     */
    public function run(string $sql): array
    {
        if (! self::isConfigured()) {
            Log::error('chat_sql_readonly_role_missing');

            return [
                'ok' => false,
                'rows' => [],
                'count' => 0,
                'error' => 'The read-only database role is not configured.',
            ];
        }

        try {
            $rows = DB::connection('pgsql_chat')->select($sql);
            $normalized = array_map(fn ($row) => (array) $row, $rows);

            return [
                'ok' => true,
                'rows' => $normalized,
                'count' => count($normalized),
                'error' => null,
            ];
        } catch (Throwable $e) {
            Log::warning('chat_sql_execution_failed', [
                'sql' => $sql,
                'error' => $e->getMessage(),
            ]);

            return [
                'ok' => false,
                'rows' => [],
                'count' => 0,
                'error' => 'Query could not be executed against the read-only replica.',
            ];
        }
    }
}
