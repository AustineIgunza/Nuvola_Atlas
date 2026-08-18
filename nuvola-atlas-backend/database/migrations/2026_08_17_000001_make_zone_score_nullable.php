<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `score` was NOT NULL, so ScoreCalculator had to coerce an unscoreable zone
 * to 0 before it could save. A zone with no indicators then ranked below a
 * zone genuinely scoring 1, sat at the bottom of every colour ramp, and
 * exported as a hard number. Null is the only value that says "not measured".
 *
 * The county rollup already worked around this with NULLIF(score, 0), which
 * has the mirror-image bug: it discards a zone that genuinely scores 0. With
 * a real null available the view can test IS NOT NULL and stop guessing.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Postgres refuses to alter a column that a matview's SELECT depends
        // on. Drop the rollup, do the column change, then rebuild it against
        // the new nullable type in one pass.
        DB::statement('DROP MATERIALIZED VIEW IF EXISTS county_vitality_rollup');

        Schema::table('zones', function (Blueprint $table) {
            $table->integer('score')->nullable()->change();
        });

        Schema::table('zone_score_snapshots', function (Blueprint $table) {
            $table->smallInteger('score')->nullable()->change();
        });

        // Only zeros with nothing behind them are converted. A zone that has
        // readings and still lands on 0 keeps its 0 — that one is measured.
        DB::table('zones')->where('score', 0)->whereNull('indicator_healthcare_access')
            ->whereNull('indicator_education_access')->whereNull('indicator_digital_connectivity')
            ->whereNull('indicator_crime_rates')->whereNull('indicator_emergency_response_access')
            ->whereNull('indicator_disaster_exposure')->whereNull('indicator_population_density')
            ->whereNull('indicator_congestion')->whereNull('indicator_housing_pressure')
            ->whereNull('indicator_road_quality')->whereNull('indicator_energy_reliability')
            ->whereNull('indicator_food_risk')->whereNull('indicator_waste_management')
            ->update(['score' => null]);

        $this->rebuildRollup('score IS NOT NULL', 'score');
    }

    public function down(): void
    {
        DB::statement('DROP MATERIALIZED VIEW IF EXISTS county_vitality_rollup');

        DB::table('zones')->whereNull('score')->update(['score' => 0]);
        DB::table('zone_score_snapshots')->whereNull('score')->update(['score' => 0]);

        Schema::table('zones', function (Blueprint $table) {
            $table->integer('score')->nullable(false)->change();
        });

        Schema::table('zone_score_snapshots', function (Blueprint $table) {
            $table->smallInteger('score')->nullable(false)->change();
        });

        $this->rebuildRollup('score > 0', 'NULLIF(score, 0)');
    }

    /**
     * A materialized view cannot be altered in place, so both directions drop
     * and recreate it. Everything except the two score predicates is copied
     * verbatim from 2026_08_16_000001.
     */
    private function rebuildRollup(string $scoredFilter, string $scoreExpr): void
    {
        DB::statement('DROP MATERIALIZED VIEW IF EXISTS county_vitality_rollup');

        DB::statement(<<<SQL
            CREATE MATERIALIZED VIEW county_vitality_rollup AS
            WITH per_zone AS (
                SELECT
                    z.score,
                    (SELECT AVG(v) FROM unnest(ARRAY[
                        z.indicator_healthcare_access,
                        z.indicator_education_access,
                        z.indicator_digital_connectivity
                    ]) AS v) AS pillar_social,
                    (SELECT AVG(v) FROM unnest(ARRAY[
                        z.indicator_crime_rates,
                        z.indicator_emergency_response_access,
                        z.indicator_disaster_exposure
                    ]) AS v) AS pillar_safety,
                    (SELECT AVG(v) FROM unnest(ARRAY[
                        z.indicator_population_density,
                        z.indicator_congestion,
                        z.indicator_housing_pressure
                    ]) AS v) AS pillar_density,
                    (SELECT AVG(v) FROM unnest(ARRAY[
                        z.indicator_road_quality,
                        z.indicator_energy_reliability,
                        z.indicator_food_risk,
                        z.indicator_waste_management
                    ]) AS v) AS pillar_infra,
                    (SELECT COUNT(v) FROM unnest(ARRAY[
                        z.indicator_healthcare_access,
                        z.indicator_education_access,
                        z.indicator_digital_connectivity,
                        z.indicator_crime_rates,
                        z.indicator_emergency_response_access,
                        z.indicator_disaster_exposure,
                        z.indicator_population_density,
                        z.indicator_congestion,
                        z.indicator_housing_pressure,
                        z.indicator_road_quality,
                        z.indicator_energy_reliability,
                        z.indicator_food_risk,
                        z.indicator_waste_management
                    ]) AS v) AS indicators_present
                FROM zones z
            )
            SELECT
                'nairobi'::varchar(64)                     AS county,
                COUNT(*)::int                              AS zone_count,
                COUNT(*) FILTER (WHERE {$scoredFilter})::int AS scored_zone_count,
                ROUND(AVG({$scoreExpr}))::smallint          AS avg_score,
                MIN({$scoreExpr})::smallint                 AS min_score,
                MAX({$scoreExpr})::smallint                 AS max_score,
                ROUND(AVG(pillar_social))::smallint         AS pillar_social,
                ROUND(AVG(pillar_safety))::smallint         AS pillar_safety,
                ROUND(AVG(pillar_density))::smallint        AS pillar_density,
                ROUND(AVG(pillar_infra))::smallint          AS pillar_infra,
                COALESCE(SUM(indicators_present), 0)::int   AS indicators_present,
                (COUNT(*) * 13)::int                        AS indicators_total,
                now()                                       AS refreshed_at
            FROM per_zone
        SQL);

        // REFRESH ... CONCURRENTLY requires a unique index on the view.
        DB::statement('CREATE UNIQUE INDEX county_vitality_rollup_county_idx ON county_vitality_rollup (county)');
    }
};
