<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase E migration 1 of 10 — extend users for firm scoping.
 *
 * `primary_firm_id` is added nullable + unconstrained here so both parents
 * can exist independently. Migration #4 in the sequence installs the FK
 * constraint once `firms` exists.
 *
 * `deactivated_at` / `last_active_at` power the admin dashboard's user
 * management drawer (soft deactivation without deleting audit history).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->uuid('primary_firm_id')->nullable()->after('partner_id');
            $table->timestamp('deactivated_at')->nullable()->after('remember_token');
            $table->timestamp('last_active_at')->nullable()->after('deactivated_at');

            $table->index('primary_firm_id');
            $table->index('deactivated_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['primary_firm_id']);
            $table->dropIndex(['deactivated_at']);
            $table->dropColumn(['primary_firm_id', 'deactivated_at', 'last_active_at']);
        });
    }
};
