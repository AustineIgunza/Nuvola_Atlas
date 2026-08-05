<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase E migration 5 of 10 — per-firm watchlist entries.
 *
 * Unique on (firm_id, zone_id) — the /investor/watchlist POST relies on
 * DB-level uniqueness rather than a redundant application check to catch
 * duplicates. Priority is a 1-5 int (1 = highest); thesis is free-text
 * annotation that the LP-style /investor/brief PDF renders back.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('firm_watchlists', function (Blueprint $table) {
            $table->id();
            $table->uuid('firm_id');
            $table->string('zone_id');
            $table->smallInteger('priority')->default(3);
            $table->text('thesis')->nullable();
            $table->timestamps();

            $table->foreign('firm_id')
                ->references('id')->on('firms')
                ->cascadeOnDelete();

            $table->foreign('zone_id')
                ->references('id')->on('zones')
                ->cascadeOnDelete();

            $table->unique(['firm_id', 'zone_id'], 'firm_watchlists_firm_zone_unique');
            $table->index('zone_id');
            $table->index(['firm_id', 'priority']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('firm_watchlists');
    }
};
