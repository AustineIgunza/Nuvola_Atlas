<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase E migration 7 of 10 — per-indicator freshness ledger.
 *
 * One row per (zone_id, indicator_key). `expected_frequency_min` is how
 * often we expect the feed to update; staleness itself is derived on read
 * by FeedStatusService — never stored — so a change in the SLA doesn't
 * require a data migration.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_feed_status', function (Blueprint $table) {
            $table->id();
            $table->string('feed_name', 96);
            $table->string('zone_id');
            $table->string('indicator_key', 64);
            $table->timestamp('last_delivered_at')->nullable();
            $table->unsignedInteger('verified_records')->default(0);
            $table->unsignedInteger('expected_frequency_min');
            $table->string('source_system', 64)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('zone_id')
                ->references('id')->on('zones')
                ->cascadeOnDelete();

            $table->unique(
                ['zone_id', 'indicator_key'],
                'data_feed_status_zone_indicator_unique'
            );

            $table->index('feed_name');
            $table->index('last_delivered_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_feed_status');
    }
};
