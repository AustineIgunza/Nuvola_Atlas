<?php

declare(strict_types=1);

namespace App\Services\Chat;

use InvalidArgumentException;

/**
 * The one non-negotiable safety net for the RAG pipeline. The LLM generates
 * SQL; we DO NOT trust it. Every query passes through validate() before
 * SqlExecutor is allowed to touch the database.
 *
 * The pgsql_chat read-only role would refuse writes anyway, but that's
 * defence-in-depth — this class is the primary line.
 */
class SqlGuard
{
    /**
     * Verbs / keywords that must never appear in a chat-generated query.
     */
    private const DENY_KEYWORDS = [
        'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE',
        'GRANT', 'REVOKE', 'COPY', 'VACUUM', 'ANALYZE', 'CLUSTER', 'REINDEX',
        'MERGE', 'CALL', 'DO', 'EXECUTE',
    ];

    /**
     * Postgres functions that give the caller access to files/network/other
     * schemas. Even a SELECT wrapper around these is a data-exfil risk.
     */
    private const DENY_FUNCTIONS = [
        'pg_read_file', 'pg_read_binary_file', 'pg_ls_dir',
        'lo_import', 'lo_export',
        'dblink', 'dblink_exec',
        'pg_sleep', // DoS
    ];

    public function __construct(
        private readonly array $allowedTables,
        private readonly int $defaultLimit = 200,
        private readonly int $hardLimit = 1000,
    ) {}

    /**
     * Validate and rewrite a query. Returns a safe SQL string or throws.
     *
     * The rewrite step is limited to LIMIT enforcement — we never rewrite
     * the semantic intent of the query.
     */
    public function validate(string $rawSql): string
    {
        $sql = $this->stripCommentsAndTrailingSemicolon($rawSql);

        if ($sql === '') {
            throw new InvalidArgumentException('Empty query.');
        }

        // Only one statement — reject any semicolon that isn't trailing
        // (already trimmed above; anything still remaining means smuggling).
        if (str_contains($sql, ';')) {
            throw new InvalidArgumentException('Multiple statements are not allowed.');
        }

        // Must start with SELECT or WITH (for CTEs whose top-level is SELECT).
        if (! preg_match('/^\s*(SELECT|WITH)\b/i', $sql)) {
            throw new InvalidArgumentException('Only SELECT / WITH queries are allowed.');
        }

        // Uppercase copy for keyword scanning (respects word boundaries).
        $upper = strtoupper($sql);

        foreach (self::DENY_KEYWORDS as $kw) {
            if (preg_match('/\b'.preg_quote($kw, '/').'\b/', $upper)) {
                throw new InvalidArgumentException("Keyword {$kw} is not allowed.");
            }
        }

        foreach (self::DENY_FUNCTIONS as $fn) {
            if (preg_match('/\b'.preg_quote(strtoupper($fn), '/').'\s*\(/', $upper)) {
                throw new InvalidArgumentException("Function {$fn} is not allowed.");
            }
        }

        $this->assertTablesAllowed($upper);

        return $this->enforceLimit($sql);
    }

    /**
     * Comments are stripped entirely — they can hide bytes past a naive
     * keyword scan. `-- DROP TABLE zones\n` on the tail of a query is
     * dead easy to smuggle, so we don't allow them at all.
     */
    private function stripCommentsAndTrailingSemicolon(string $sql): string
    {
        // Block comments /* ... */
        if (str_contains($sql, '/*')) {
            throw new InvalidArgumentException('Block comments are not allowed.');
        }
        // Line comments --
        if (preg_match('/--/', $sql)) {
            throw new InvalidArgumentException('Line comments are not allowed.');
        }

        $sql = trim($sql);
        // One trailing semicolon is ok — drop it.
        if (str_ends_with($sql, ';')) {
            $sql = rtrim(substr($sql, 0, -1));
        }

        return $sql;
    }

    /**
     * Naive but effective: identifiers referenced in FROM / JOIN clauses
     * are matched against the allowlist. Any bare table name in the query
     * that isn't in the allowlist (and isn't a CTE alias / subquery alias)
     * causes rejection.
     *
     * We do this on the uppercased query so table names are compared
     * case-insensitively.
     */
    private function assertTablesAllowed(string $upper): void
    {
        $allowedUpper = array_map('strtoupper', $this->allowedTables);

        // Grab tokens after FROM / JOIN — strip schema qualifiers.
        preg_match_all('/\b(?:FROM|JOIN)\s+([A-Z0-9_.]+)/', $upper, $matches);

        foreach ($matches[1] as $ident) {
            $bare = str_contains($ident, '.') ? substr(strrchr($ident, '.'), 1) : $ident;
            if (! in_array($bare, $allowedUpper, true)) {
                // CTE aliases would show up here too; require them to be
                // separately declared via WITH (we allow WITH prefix at
                // start). If someone WITH-aliases a name that matches an
                // allowed table, that's still safe — they can't reach
                // outside the allowlist because the CTE itself must
                // reference an allowed table to have any data.
                //
                // To keep this simple we just reject unknown identifiers.
                throw new InvalidArgumentException(
                    "Table `{$bare}` is not in the allowlist."
                );
            }
        }
    }

    /**
     * Ensure the query is bounded. If no LIMIT is present, append one.
     * If the existing LIMIT is larger than hardLimit, rewrite it down.
     */
    private function enforceLimit(string $sql): string
    {
        if (preg_match('/\bLIMIT\s+(\d+)\b/i', $sql, $m, PREG_OFFSET_CAPTURE)) {
            $n = (int) $m[1][0];
            if ($n > $this->hardLimit) {
                $offset = $m[1][1];
                $len = strlen($m[1][0]);

                return substr($sql, 0, $offset)
                    .(string) $this->hardLimit
                    .substr($sql, $offset + $len);
            }

            return $sql;
        }

        return $sql.' LIMIT '.$this->defaultLimit;
    }
}
