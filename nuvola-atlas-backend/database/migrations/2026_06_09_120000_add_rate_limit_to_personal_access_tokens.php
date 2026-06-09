<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            // Null = no per-token cap (the request still falls through to the
            // default `api` limiter). Set by the admin mint wizard when an
            // API key is issued to a programmatic partner so abuse on one
            // key can't burn the global ceiling for everyone else.
            $table->unsignedSmallInteger('rate_limit_per_minute')->nullable()->after('abilities');
        });
    }

    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->dropColumn('rate_limit_per_minute');
        });
    }
};
