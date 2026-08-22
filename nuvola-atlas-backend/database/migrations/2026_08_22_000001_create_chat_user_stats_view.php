<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        // security_invoker = false (the Postgres default, stated here because
        // the whole design leans on it) means the view executes with its
        // owner's rights. The chat role can therefore read these three
        // columns without ever holding a grant on `users`.
        DB::statement(<<<'SQL'
            CREATE OR REPLACE VIEW public.chat_user_stats
            WITH (security_invoker = false) AS
            SELECT id, role, created_at
            FROM public.users
        SQL);

        $role = $this->chatRole();

        if ($role === null) {
            return;
        }

        // `users` sat in ai.allowed_tables until Aug 2026, so every database
        // migrated before today already handed the chat role SELECT on email
        // and password. Revoking is the point of this migration; creating the
        // view is just what makes the revoke survivable.
        DB::statement("REVOKE ALL PRIVILEGES ON TABLE public.users FROM {$role}");
        DB::statement("GRANT SELECT ON TABLE public.chat_user_stats TO {$role}");
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        $role = $this->chatRole();

        if ($role !== null) {
            DB::statement("REVOKE ALL PRIVILEGES ON TABLE public.chat_user_stats FROM {$role}");
        }

        // Deliberately does not re-grant `users`. Rolling this migration back
        // should leave the chat role with less access, never more.
        DB::statement('DROP VIEW IF EXISTS public.chat_user_stats');
    }

    /**
     * The quoted chat role identifier, or null when no role is provisioned
     * (no key configured, or configured but not yet created in this cluster).
     */
    private function chatRole(): ?string
    {
        $roleName = env('DB_CHAT_RO_USER');

        if (empty($roleName)) {
            return null;
        }

        $exists = DB::selectOne('SELECT 1 AS ok FROM pg_roles WHERE rolname = ?', [$roleName]);

        return $exists ? '"'.str_replace('"', '""', $roleName).'"' : null;
    }
};
