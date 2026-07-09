<?php

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

        // Only create the role in non-testing environments. Tests use
        // the primary DB user via the pgsql_chat connection fallback so
        // we don't need role setup during phpunit — RefreshDatabase would
        // fight with pre-existing roles across test runs anyway.
        if (app()->environment('testing')) {
            return;
        }

        $roleName = env('DB_CHAT_RO_USER');
        $password = env('DB_CHAT_RO_PASSWORD');
        $database = config('database.connections.pgsql.database');

        if (empty($roleName) || empty($password)) {
            // Nothing to provision. Local dev without a real key still
            // works via the pgsql_chat fallback to the primary user.
            return;
        }

        $exists = DB::selectOne("SELECT 1 AS ok FROM pg_roles WHERE rolname = ?", [$roleName]);

        if (! $exists) {
            DB::statement("CREATE ROLE {$this->quoteIdent($roleName)} LOGIN PASSWORD ?", [$password]);
        }

        DB::statement("GRANT CONNECT ON DATABASE {$this->quoteIdent($database)} TO {$this->quoteIdent($roleName)}");
        DB::statement("GRANT USAGE ON SCHEMA public TO {$this->quoteIdent($roleName)}");

        foreach (config('ai.allowed_tables', []) as $table) {
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
        if (app()->environment('testing')) {
            return;
        }

        $roleName = env('DB_CHAT_RO_USER');
        if (empty($roleName)) {
            return;
        }

        $exists = DB::selectOne("SELECT 1 AS ok FROM pg_roles WHERE rolname = ?", [$roleName]);
        if (! $exists) {
            return;
        }

        $database = config('database.connections.pgsql.database');

        foreach (config('ai.allowed_tables', []) as $table) {
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
        return '"' . str_replace('"', '""', $ident) . '"';
    }
};
