<?php

declare(strict_types=1);

use App\Support\Pillars;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One column per live pillar on `zones` and `zone_score_snapshots`.
 *
 * The four-pillar model averaged three or four indicators into each pillar.
 * The refocused model has one measured number per pillar per sub-county —
 * percentage of households with an improved water source, kilometres of road
 * per square kilometre, and so on — so the intermediate indicator layer has
 * nothing left to average and the value lands directly on the pillar.
 *
 * The thirteen `indicator_*` columns are deliberately left in place. Dropping
 * them would discard the snapshot history that the trend chart reads, and
 * nothing reads them any more, so they cost only disk.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (['zones', 'zone_score_snapshots'] as $table) {
            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                foreach (Pillars::keys() as $key) {
                    $column = Pillars::column($key);
                    if (Schema::hasColumn($table, $column)) {
                        continue;
                    }
                    // Null means "not measured here yet" and is the default.
                    // It must never be read as a zero — a sub-county with no
                    // reading has not scored badly, it has not scored at all.
                    $blueprint->unsignedTinyInteger($column)->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        foreach (['zones', 'zone_score_snapshots'] as $table) {
            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                foreach (Pillars::keys() as $key) {
                    $column = Pillars::column($key);
                    if (Schema::hasColumn($table, $column)) {
                        $blueprint->dropColumn($column);
                    }
                }
            });
        }
    }
};
