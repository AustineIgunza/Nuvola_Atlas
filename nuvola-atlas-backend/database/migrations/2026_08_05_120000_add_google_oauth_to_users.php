<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Google Sign-In columns on users.
 *
 * `google_id` — the sub claim from Google's ID token. Nullable so
 * password-account users still validate. Unique so a Google identity
 * can't attach to two accounts.
 * `avatar_url` — surfaced in the frontend user chip. Nullable.
 * `oauth_provider` — 'google' | null. Distinguishes password vs OAuth
 * accounts on the /auth/me payload so the frontend knows to hide the
 * password-change UI for OAuth-only users.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('google_id', 96)->nullable()->unique()->after('email');
            $table->string('avatar_url', 512)->nullable()->after('google_id');
            $table->string('oauth_provider', 32)->nullable()->after('avatar_url');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['google_id']);
            $table->dropColumn(['google_id', 'avatar_url', 'oauth_provider']);
        });
    }
};
