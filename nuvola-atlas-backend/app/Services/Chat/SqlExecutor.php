<?php

declare(strict_types=1);

namespace App\Services\Chat;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class SqlExecutor
{
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
