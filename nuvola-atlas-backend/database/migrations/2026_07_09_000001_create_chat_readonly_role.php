<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Only run against real Postgres. Skipped for sqlite (test env
        // sanity) and for any other driver.
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        // This runs under phpunit too. The grants are the primary control on
        // what the chat pipeline can read, so a suite that ran as the
        // privileged user would be proving nothing. Roles are cluster-level
        // and survive migrate:fresh; the pg_roles check below keeps the
        // create idempotent across runs.
        $roleName = env('DB_CHAT_RO_USER');
        $password = env('DB_CHAT_RO_PASSWORD');
        $database = config('database.connections.pgsql.database');

        if (empty($roleName) || empty($password)) {
            // Nothing to provision. The chat endpoint fails closed without
            // these — see SqlExecutor::isConfigured().
            return;
        }

        $exists = DB::selectOne('SELECT 1 AS ok FROM pg_roles WHERE rolname = ?', [$roleName]);

        // Postgres does not accept bind parameters in utility statements,
        // so the password is quoted by the driver and inlined. Converging
        // on every run rather than only at creation keeps the env file the
        // source of truth for a role that outlives any single database.
        $quotedPassword = DB::getPdo()->quote($password);

        DB::statement($exists
            ? "ALTER ROLE {$this->quoteIdent($roleName)} LOGIN PASSWORD {$quotedPassword}"
            : "CREATE ROLE {$this->quoteIdent($roleName)} LOGIN PASSWORD {$quotedPassword}");

        DB::statement("GRANT CONNECT ON DATABASE {$this->quoteIdent($database)} TO {$this->quoteIdent($roleName)}");
        DB::statement("GRANT USAGE ON SCHEMA public TO {$this->quoteIdent($roleName)}");

        foreach (config('ai.allowed_tables', []) as $table) {
            // The allowlist can name a relation that a later migration
            // creates — chat_user_stats does not exist yet on a fresh
            // migrate. Grant what is there; the migration that introduces
            // the relation grants its own access.
            if (! $this->relationExists($table)) {
                continue;
            }

            DB::statement("GRANT SELECT ON TABLE public.{$this->quoteIdent($table)} TO {$this->quoteIdent($roleName)}");
        }

        // Deny anything that lands in public.* later unless we grant
        // explicitly — belt on top of the guard.
        DB::statement("REVOKE CREATE ON SCHEMA public FROM {$this->quoteIdent($roleName)}");
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }
        $roleName = env('DB_CHAT_RO_USER');
        if (empty($roleName)) {
            return;
        }

        $exists = DB::selectOne('SELECT 1 AS ok FROM pg_roles WHERE rolname = ?', [$roleName]);
        if (! $exists) {
            return;
        }

        $database = config('database.connections.pgsql.database');

        foreach (config('ai.allowed_tables', []) as $table) {
            if (! $this->relationExists($table)) {
                continue;
            }

            DB::statement("REVOKE SELECT ON TABLE public.{$this->quoteIdent($table)} FROM {$this->quoteIdent($roleName)}");
        }
        DB::statement("REVOKE USAGE ON SCHEMA public FROM {$this->quoteIdent($roleName)}");
        DB::statement("REVOKE CONNECT ON DATABASE {$this->quoteIdent($database)} FROM {$this->quoteIdent($roleName)}");
        DB::statement("DROP ROLE {$this->quoteIdent($roleName)}");
    }

    /**
     * Identifier quoting for Postgres — role name and table name come from
     * config, not user input, but we still avoid string interpolation for
     * anything that could contain non-standard characters.
     */
    private function quoteIdent(string $ident): string
    {
        return '"'.str_replace('"', '""', $ident).'"';
    }

    private function relationExists(string $table): bool
    {
        $row = DB::selectOne('SELECT to_regclass(?) AS oid', ['public.'.$table]);

        return $row !== null && $row->oid !== null;
    }
};
