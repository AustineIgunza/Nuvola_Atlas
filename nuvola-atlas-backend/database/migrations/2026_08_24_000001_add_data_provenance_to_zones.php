<?php

declare(strict_types=1);

use App\Support\DataProvenance;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The fixture gate (P7.3 in NAVUUNA_PROMPTS_ROUND2.md).
 *
 * Every zone score gains a data_provenance flag that says whether the
 * contributing pillar values traced to a real ingested feed or to a
 * seeder/fixture. Downstream code (ScoreCalculator, ZoneResource,
 * ZoneExportController) reads this to decide whether the score may
 * leave the system.
 *
 * All existing rows backfill to 'fixture'. This is not a bug — everything
 * currently in the table came from seeders. Real ingest paths will set
 * 'measured' as they land readings; a zone gains 'measured' the moment
 * every contributing pillar traces back to a live feed.
 *
 * Snapshots gain the flag too, so trend history preserves whether an
 * older score was demo data. Otherwise a rebuild would silently promote
 * seeded values to 'measured' just because the current pillar row is.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (['zones', 'zone_score_snapshots'] as $table) {
            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                if (Schema::hasColumn($table, 'data_provenance')) {
                    return;
                }
                $blueprint->string('data_provenance', 16)
                    ->default(DataProvenance::FIXTURE)
                    ->comment('measured|fixture|mixed — the fixture gate, see App\\Support\\DataProvenance');
            });
        }

        // Explicit backfill for existing rows so the default only governs
        // future inserts. Belt and braces: if the default is dropped or
        // overridden later, historical rows still carry the honest flag.
        DB::table('zones')
            ->whereNull('data_provenance')
            ->orWhere('data_provenance', '')
            ->update(['data_provenance' => DataProvenance::FIXTURE]);
        DB::table('zone_score_snapshots')
            ->whereNull('data_provenance')
            ->orWhere('data_provenance', '')
            ->update(['data_provenance' => DataProvenance::FIXTURE]);
    }

    public function down(): void
    {
        foreach (['zones', 'zone_score_snapshots'] as $table) {
            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                if (Schema::hasColumn($table, 'data_provenance')) {
                    $blueprint->dropColumn('data_provenance');
                }
            });
        }
    }
};
