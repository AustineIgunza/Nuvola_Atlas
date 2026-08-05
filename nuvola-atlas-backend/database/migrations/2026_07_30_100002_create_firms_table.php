<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase E migration 2 of 10 — investor firms.
 *
 * `tier` gates the opportunity-ranking heuristic in
 * `WatchlistService::opportunities()` (basic → yield-first, deal → growth,
 * sovereign → resilience). Enum enforced at the DB level so a bad tier
 * cannot slip past a raw DB insert. `slug` is unique and used in URLs.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('firms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug', 96)->unique();
            $table->string('tier', 16);
            $table->string('contact_email')->nullable();
            $table->string('contact_name')->nullable();
            $table->string('website')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index('tier');
            $table->index('active');
        });

        DB::statement(<<<'SQL'
            ALTER TABLE firms
            ADD CONSTRAINT firms_tier_check
            CHECK (tier IN ('basic', 'deal', 'sovereign'))
        SQL);
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE firms DROP CONSTRAINT IF EXISTS firms_tier_check');
        Schema::dropIfExists('firms');
    }
};
