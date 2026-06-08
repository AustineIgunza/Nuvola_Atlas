<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Two timestamps that drive the force-2FA enrolment escalation (§9.13):
     *   email_two_factor_reminded_at — first nudge sent
     *   email_two_factor_locked_at   — escalation; tokens revoked, admin
     *                                  effectively locked out of /admin
     *                                  until they enrol
     *
     * Both are nulled by TwoFactorController::emailConfirm when the user
     * successfully enrols, so the columns self-heal.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->timestamp('email_two_factor_reminded_at')->nullable()->after('email_two_factor_enabled_at');
            $table->timestamp('email_two_factor_locked_at')->nullable()->after('email_two_factor_reminded_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['email_two_factor_reminded_at', 'email_two_factor_locked_at']);
        });
    }
};
