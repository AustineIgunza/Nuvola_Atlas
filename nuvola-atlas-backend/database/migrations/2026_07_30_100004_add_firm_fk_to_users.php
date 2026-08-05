<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Phase E migration 4 of 10 — finalise the primary_firm_id FK.
 *
 * Split out from migration #1 so both parents exist when the FK lands.
 * SET NULL on firm delete rather than cascade — losing a firm shouldn't
 * cascade-delete every user account associated with it (they may still
 * have platform-level roles that outlive the firm relationship).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
            ALTER TABLE users
            ADD CONSTRAINT users_primary_firm_id_foreign
            FOREIGN KEY (primary_firm_id) REFERENCES firms(id)
            ON DELETE SET NULL
        SQL);
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_primary_firm_id_foreign');
    }
};
