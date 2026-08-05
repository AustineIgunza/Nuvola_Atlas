<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase E migration 3 of 10 — pivot between users and firms.
 *
 * A user can belong to many firms (an analyst on rotation between two LP
 * groups, e.g.) — `role_within_firm` is intra-firm authority, distinct from
 * the platform-wide `users.role` enum.
 *
 * Composite unique on (firm_id, user_id) prevents duplicate rows without
 * needing an application-level check.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('firm_users', function (Blueprint $table) {
            $table->id();
            $table->uuid('firm_id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role_within_firm', 16);
            $table->timestamps();

            $table->foreign('firm_id')
                ->references('id')->on('firms')
                ->cascadeOnDelete();

            $table->unique(['firm_id', 'user_id'], 'firm_users_firm_user_unique');
            $table->index('user_id');
        });

        DB::statement(<<<'SQL'
            ALTER TABLE firm_users
            ADD CONSTRAINT firm_users_role_check
            CHECK (role_within_firm IN ('viewer', 'analyst', 'admin'))
        SQL);
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE firm_users DROP CONSTRAINT IF EXISTS firm_users_role_check');
        Schema::dropIfExists('firm_users');
    }
};
