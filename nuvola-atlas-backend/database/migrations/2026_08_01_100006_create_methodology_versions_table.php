<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase E migration 6 of 10 — versioned methodology weights + bands.
 *
 * `weights` jsonb holds the 4-key pillar weight vector; `bands` jsonb the
 * score-band definitions (excellent / good / needs-attention thresholds).
 *
 * PARTIAL UNIQUE INDEX on (is_current) WHERE is_current guarantees exactly
 * one row can carry the flag at any time — MethodologyPublisher (Khillon
 * Week 3) flips the previous row off before setting the new one, wrapped
 * in a transaction so the constraint bites if the swap is broken.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('methodology_versions', function (Blueprint $table) {
            $table->id();
            $table->string('version', 32);
            $table->jsonb('weights');
            $table->jsonb('bands');
            $table->boolean('is_current')->default(false);
            $table->boolean('draft')->default(false);
            $table->text('changelog')->nullable();
            $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique('version');
        });

        // Partial unique on is_current so exactly one row can be live at a
        // time. Postgres treats FALSE and NULL as non-matches — this is the
        // simplest way to model "one live row" without an app-level guard.
        DB::statement(<<<'SQL'
            CREATE UNIQUE INDEX methodology_versions_current_unique
            ON methodology_versions (is_current)
            WHERE is_current IS TRUE
        SQL);
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS methodology_versions_current_unique');
        Schema::dropIfExists('methodology_versions');
    }
};
