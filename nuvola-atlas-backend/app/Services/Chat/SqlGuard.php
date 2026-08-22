<?php

declare(strict_types=1);

namespace App\Services\Chat;

use InvalidArgumentException;

/**
 * Structural validation of LLM-authored SQL before SqlExecutor runs it.
 *
 * This is defence in depth, not the guard. The primary control is the
 * `pgsql_chat` role's grants: it holds SELECT on the allowlisted relations
 * and nothing else, so a query this class wrongly waves through still
 * cannot read a password hash. Assume this class will eventually be
 * bypassed and keep that survivable.
 *
 * Validation runs over SqlLexer tokens rather than the query text. Regexes
 * over raw SQL cannot distinguish a keyword from the same letters inside a
 * string literal, which made the old implementation both unsafe (a table
 * name reachable through a comma join or a subquery went unchecked) and
 * wrong (any query mentioning "update" in a WHERE clause was rejected).
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

    /**
     * The SQL constructs that spell an argument separator `FROM`. Inside
     * any other parenthesised call a `FROM` opens a real subquery clause
     * and has to be walked.
     */
    private const FROM_TAKING_FUNCTIONS = [
        'EXTRACT', 'SUBSTRING', 'TRIM', 'OVERLAY', 'POSITION',
    ];

    /**
     * Words that end a FROM list. Anything else continues it.
     */
    private const FROM_LIST_TERMINATORS = [
        'WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT', 'OFFSET', 'FETCH',
        'WINDOW', 'UNION', 'INTERSECT', 'EXCEPT', 'FOR',
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
        $sql = trim($rawSql);
        $tokens = (new SqlLexer)->tokenize($sql);

        [$sql, $tokens] = $this->stripTrailingSemicolon($sql, $tokens);

        if ($tokens === []) {
            throw new InvalidArgumentException('Empty query.');
        }

        $this->assertNoComments($tokens);
        $this->assertSingleStatement($tokens);
        $this->assertStartsWithSelect($tokens);
        $this->assertNoDeniedKeywords($tokens);
        $this->assertNoDeniedFunctions($tokens);
        $this->assertTablesAllowed($tokens);

        return $this->enforceLimit($sql, $tokens);
    }

    /**
     * Comments are rejected outright rather than stripped. There is no
     * legitimate reason for generated SQL to carry one, and allowing them
     * only widens what a prompt injection can hide behind.
     *
     * @param  list<SqlToken>  $tokens
     */
    private function assertNoComments(array $tokens): void
    {
        foreach ($tokens as $token) {
            if ($token->type === SqlToken::COMMENT) {
                throw new InvalidArgumentException('Comments are not allowed.');
            }
        }
    }

    /**
     * @param  list<SqlToken>  $tokens
     * @return array{0: string, 1: list<SqlToken>}
     */
    private function stripTrailingSemicolon(string $sql, array $tokens): array
    {
        $last = end($tokens);

        if ($last instanceof SqlToken && $last->isPunct(';')) {
            array_pop($tokens);
            $sql = rtrim(substr($sql, 0, $last->offset));
        }

        return [$sql, $tokens];
    }

    /**
     * @param  list<SqlToken>  $tokens
     */
    private function assertSingleStatement(array $tokens): void
    {
        foreach ($tokens as $token) {
            if ($token->isPunct(';')) {
                throw new InvalidArgumentException('Multiple statements are not allowed.');
            }
        }
    }

    /**
     * @param  list<SqlToken>  $tokens
     */
    private function assertStartsWithSelect(array $tokens): void
    {
        if (! $tokens[0]->isWord('SELECT', 'WITH')) {
            throw new InvalidArgumentException('Only SELECT / WITH queries are allowed.');
        }
    }

    /**
     * @param  list<SqlToken>  $tokens
     */
    private function assertNoDeniedKeywords(array $tokens): void
    {
        foreach ($tokens as $token) {
            foreach (self::DENY_KEYWORDS as $keyword) {
                if ($token->isWord($keyword)) {
                    throw new InvalidArgumentException("Keyword {$keyword} is not allowed.");
                }
            }
        }
    }

    /**
     * @param  list<SqlToken>  $tokens
     */
    private function assertNoDeniedFunctions(array $tokens): void
    {
        $denied = array_map('strtoupper', self::DENY_FUNCTIONS);

        foreach ($tokens as $index => $token) {
            if (! $token->isWord(...$denied)) {
                continue;
            }

            if (($tokens[$index + 1] ?? null)?->isPunct('(')) {
                throw new InvalidArgumentException(
                    'Function '.strtolower($token->value).' is not allowed.'
                );
            }
        }
    }

    /**
     * Every relation the query reads must be allowlisted or defined by a
     * CTE in the same query. Table references are found structurally, so
     * comma joins, subqueries in any clause, and CTE bodies are all
     * covered — those were the holes in the FROM/JOIN regex this replaced.
     *
     * @param  list<SqlToken>  $tokens
     */
    private function assertTablesAllowed(array $tokens): void
    {
        $allowed = array_map('strtolower', $this->allowedTables);
        $known = array_merge($allowed, $this->cteNames($tokens));

        foreach ($this->tableReferences($tokens) as $table) {
            if (! in_array(strtolower($table), $known, true)) {
                throw new InvalidArgumentException("Table `{$table}` is not in the allowlist.");
            }
        }
    }

    /**
     * Names bound by a leading WITH clause. A CTE can shadow nothing
     * dangerous: its own body is walked by tableReferences() like any
     * other part of the query.
     *
     * @param  list<SqlToken>  $tokens
     * @return list<string>
     */
    private function cteNames(array $tokens): array
    {
        if (! $tokens[0]->isWord('WITH')) {
            return [];
        }

        $names = [];
        $index = 1;

        if (($tokens[$index] ?? null)?->isWord('RECURSIVE')) {
            $index++;
        }

        $count = count($tokens);

        while ($index < $count) {
            $token = $tokens[$index];

            if ($token->depth !== 0 || $token->identifier() === null) {
                break;
            }

            $names[] = $token->identifier();
            $index++;

            // Optional column list, then AS, then the parenthesised body.
            $index = $this->skipParenthesised($tokens, $index);

            if (($tokens[$index] ?? null)?->isWord('AS')) {
                $index++;
            }

            while (($tokens[$index] ?? null)?->isWord('NOT', 'MATERIALIZED')) {
                $index++;
            }

            $index = $this->skipParenthesised($tokens, $index);

            if (($tokens[$index] ?? null)?->isPunct(',')) {
                $index++;

                continue;
            }

            break;
        }

        return $names;
    }

    /**
     * Walk every FROM / JOIN in the query and collect the relations they
     * name.
     *
     * @param  list<SqlToken>  $tokens
     * @return list<string>
     */
    private function tableReferences(array $tokens): array
    {
        $tables = [];
        $count = count($tokens);

        for ($index = 0; $index < $count; $index++) {
            $token = $tokens[$index];

            if ($token->isWord('JOIN')) {
                $this->readTableReference($tokens, $index + 1, $tables);

                continue;
            }

            if (! $token->isWord('FROM') || $this->isFunctionArgumentSeparator($tokens, $index)) {
                continue;
            }

            // The scan deliberately does not skip ahead past the list it
            // just read. A derived table's own FROM has to be visited on a
            // later iteration, and re-reading a relation costs nothing.
            $this->readFromList($tokens, $index + 1, $tables);
        }

        return $tables;
    }

    /**
     * `EXTRACT(YEAR FROM captured_at)` is not a FROM clause. Only the
     * handful of constructs in FROM_TAKING_FUNCTIONS spell one this way,
     * so anything else — `id IN (SELECT ... FROM users)` above all —
     * still gets walked.
     *
     * @param  list<SqlToken>  $tokens
     */
    private function isFunctionArgumentSeparator(array $tokens, int $index): bool
    {
        $depth = $tokens[$index]->depth;

        if ($depth === 0) {
            return false;
        }

        for ($i = $index - 1; $i >= 0; $i--) {
            if ($tokens[$i]->isPunct('(') && $tokens[$i]->depth === $depth - 1) {
                return ($tokens[$i - 1] ?? null)?->isWord(...self::FROM_TAKING_FUNCTIONS) ?? false;
            }
        }

        return false;
    }

    /**
     * Read a comma-separated FROM list, which is where the old regex lost
     * everything after the first entry.
     *
     * @param  list<SqlToken>  $tokens
     * @param  list<string>  $tables
     */
    private function readFromList(array $tokens, int $index, array &$tables): void
    {
        $depth = $tokens[$index - 1]->depth;
        $count = count($tokens);

        while ($index < $count) {
            $index = $this->readTableReference($tokens, $index, $tables);

            // Step over aliases and join conditions until the list either
            // continues past a comma or ends.
            while ($index < $count) {
                $token = $tokens[$index];

                if ($token->depth < $depth) {
                    return;
                }

                if ($token->depth === $depth) {
                    if ($token->isPunct(',')) {
                        break;
                    }

                    // JOIN is picked up by the outer walk.
                    if ($token->isWord('JOIN', ...self::FROM_LIST_TERMINATORS) || $token->isPunct(';')) {
                        return;
                    }
                }

                $index++;
            }

            $index++;
        }
    }

    /**
     * Read one table reference. Returns the index just past it.
     *
     * @param  list<SqlToken>  $tokens
     * @param  list<string>  $tables
     */
    private function readTableReference(array $tokens, int $index, array &$tables): int
    {
        $count = count($tokens);

        while (($tokens[$index] ?? null)?->isWord('LATERAL', 'ONLY')) {
            $index++;
        }

        $token = $tokens[$index] ?? null;

        if ($token === null) {
            return $count;
        }

        // A derived table. Its inner FROM is reached by the outer walk.
        if ($token->isPunct('(')) {
            return $this->skipParenthesised($tokens, $index);
        }

        $name = $token->identifier();

        if ($name === null) {
            return $index + 1;
        }

        // `schema.table` — the last segment is the relation.
        while (($tokens[$index + 1] ?? null)?->isPunct('.')) {
            $next = $tokens[$index + 2] ?? null;

            if ($next === null || $next->identifier() === null) {
                break;
            }

            $name = $next->identifier();
            $index += 2;
        }

        // A set-returning function in table position. Not needed for this
        // workload, and allowing it would mean allowlisting a call surface
        // rather than a relation.
        if (($tokens[$index + 1] ?? null)?->isPunct('(')) {
            throw new InvalidArgumentException(
                "Function `{$name}` is not allowed as a table source."
            );
        }

        $tables[] = $name;

        return $index + 1;
    }

    /**
     * If the token at $index opens a paren, return the index just past its
     * match. Otherwise return $index untouched.
     *
     * @param  list<SqlToken>  $tokens
     */
    private function skipParenthesised(array $tokens, int $index): int
    {
        if (! ($tokens[$index] ?? null)?->isPunct('(')) {
            return $index;
        }

        $depth = $tokens[$index]->depth;
        $count = count($tokens);
        $index++;

        while ($index < $count) {
            if ($tokens[$index]->isPunct(')') && $tokens[$index]->depth === $depth) {
                return $index + 1;
            }

            $index++;
        }

        return $count;
    }

    /**
     * Ensure the query is bounded. If no top-level LIMIT is present, append
     * one. If the existing one is larger than hardLimit, rewrite it down.
     *
     * Only depth 0 counts: a LIMIT inside a subquery bounds that subquery,
     * not the rows we hand back.
     *
     * @param  list<SqlToken>  $tokens
     */
    private function enforceLimit(string $sql, array $tokens): string
    {
        $count = count($tokens);

        for ($index = 0; $index < $count; $index++) {
            $token = $tokens[$index];

            if ($token->depth !== 0 || ! $token->isWord('LIMIT')) {
                continue;
            }

            $value = $tokens[$index + 1] ?? null;

            if ($value === null || $value->type !== SqlToken::NUMBER) {
                continue;
            }

            if ((int) $value->value <= $this->hardLimit) {
                return $sql;
            }

            return substr($sql, 0, $value->offset)
                .$this->hardLimit
                .substr($sql, $value->offset + $value->length);
        }

        return $sql.' LIMIT '.$this->defaultLimit;
    }
}
