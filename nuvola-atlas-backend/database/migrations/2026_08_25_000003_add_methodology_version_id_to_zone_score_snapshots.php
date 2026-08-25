<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * P8 §Task 3 — bind every score snapshot to the methodology version it was
 * computed under. Without this, republishing methodology weights would
 * silently rewrite the interpretation of every historical score: a chart
 * comparing March to September would draw two dots on the same axis that
 * used two different weighting vectors.
 *
 * `methodology_version_id` is nullable because rows pre-dating this
 * migration have no honest way to name the version they were computed
 * against. Backfilling with the currently-live version pretends the
 * history was always under v-current, which is close-enough truth for
 * existing rows and the exact behaviour a caller expects on read.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('zone_score_snapshots', function (Blueprint $table) {
            $table->foreignId('methodology_version_id')
                ->nullable()
                ->after('captured_at')
                ->constrained('methodology_versions')
                ->nullOnDelete();
        });

        // Backfill: any pre-existing snapshot is assumed to have been
        // written under the currently-live version. This is a claim about
        // the past that is not verifiable — but the alternative (leaving
        // them null forever) breaks the chart until the next Recalculate,
        // and a null in that column is what a genuinely-unversioned row
        // will look like going forward.
        DB::statement(<<<'SQL'
            UPDATE zone_score_snapshots
            SET methodology_version_id = (
                SELECT id FROM methodology_versions WHERE is_current = TRUE LIMIT 1
            )
            WHERE methodology_version_id IS NULL
        SQL);
    }

    public function down(): void
    {
        Schema::table('zone_score_snapshots', function (Blueprint $table) {
            $table->dropConstrainedForeignId('methodology_version_id');
        });
    }
};
