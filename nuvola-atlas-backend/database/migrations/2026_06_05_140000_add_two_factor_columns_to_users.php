<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 2FA TOTP columns on users (todo §9.3).
 *
 * Secret + recovery codes are stored encrypted via Crypt::encryptString in
 * the model accessors. We keep the columns as `text` (not jsonb) because
 * Laravel's Crypt output is opaque ciphertext.
 *
 * `two_factor_confirmed_at` is the single source of truth for "this account
 * has 2FA on". An unconfirmed secret (set but never verified) does NOT
 * unlock 2FA — the user could lose the QR mid-setup and be locked out
 * otherwise.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('two_factor_secret')->nullable()->after('partner_id');
            $table->text('two_factor_recovery_codes')->nullable()->after('two_factor_secret');
            $table->timestamp('two_factor_confirmed_at')->nullable()->after('two_factor_recovery_codes');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['two_factor_secret', 'two_factor_recovery_codes', 'two_factor_confirmed_at']);
        });
    }
};
