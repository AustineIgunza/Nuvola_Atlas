<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pivot from TOTP to email-based 2FA.
 *
 * Drops the TOTP secret + recovery codes columns added in
 * 2026_06_05_140000 and replaces `two_factor_confirmed_at` with
 * `email_two_factor_enabled_at`. The new flow generates a 6-digit code,
 * caches it for 5 minutes, and emails it to the user — no authenticator
 * app needed, no secret to store on the user row.
 *
 * No data preservation: the TOTP rollout was 24h old when this migration
 * landed, so any test rows that had two_factor_confirmed_at set will
 * lose their enrolment and need to re-enrol via the email flow.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['two_factor_secret', 'two_factor_recovery_codes', 'two_factor_confirmed_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('email_two_factor_enabled_at')->nullable()->after('partner_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('email_two_factor_enabled_at');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->text('two_factor_secret')->nullable()->after('partner_id');
            $table->text('two_factor_recovery_codes')->nullable()->after('two_factor_secret');
            $table->timestamp('two_factor_confirmed_at')->nullable()->after('two_factor_recovery_codes');
        });
    }
};
