<?php

declare(strict_types=1);

use App\Support\Pillars;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The freshness ledger tracked one row per retired indicator. Under the pillar
 * registry the column holds a pillar key, so the name follows the contents.
 *
 * Rows keyed on an indicator that no longer exists are deleted rather than
 * remapped: `healthcare_access` has no pillar to become, and inventing a
 * mapping would put a fabricated feed on the admin freshness board.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('data_feed_status')) {
            return;
        }

        DB::statement('ALTER TABLE data_feed_status RENAME COLUMN indicator_key TO pillar_key');
        DB::statement('ALTER TABLE data_feed_status RENAME CONSTRAINT data_feed_status_zone_indicator_unique TO data_feed_status_zone_pillar_unique');

        DB::table('data_feed_status')
            ->whereNotIn('pillar_key', Pillars::keys())
            ->delete();
    }

    public function down(): void
    {
        if (! Schema::hasTable('data_feed_status')) {
            return;
        }

        DB::statement('ALTER TABLE data_feed_status RENAME CONSTRAINT data_feed_status_zone_pillar_unique TO data_feed_status_zone_indicator_unique');
        DB::statement('ALTER TABLE data_feed_status RENAME COLUMN pillar_key TO indicator_key');
    }
};
