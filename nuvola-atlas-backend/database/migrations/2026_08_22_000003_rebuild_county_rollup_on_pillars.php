<?php

declare(strict_types=1);

use App\Support\Pillars;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * `county_vitality_rollup` averaged the thirteen `indicator_*` columns into
 * four hardcoded pillars. Those indicators are no longer written, so the view
 * would report the county on a model nothing feeds.
 *
 * Rebuilt over the `pillar_*` columns, with the column list taken from the
 * registry rather than spelled out — a pillar that gets switched off has to
 * disappear from the county banner in the same commit it disappears from
 * everywhere else, not whenever someone remembers this file exists.
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->rebuild(array_map(
            fn (string $key) => Pillars::column($key),
            Pillars::keys(),
        ));
    }

    public function down(): void
    {
        $this->rebuild([
            'indicator_healthcare_access',
            'indicator_education_access',
            'indicator_digital_connectivity',
            'indicator_crime_rates',
            'indicator_emergency_response_access',
            'indicator_disaster_exposure',
            'indicator_population_density',
            'indicator_congestion',
            'indicator_housing_pressure',
            'indicator_road_quality',
            'indicator_energy_reliability',
            'indicator_food_risk',
            'indicator_waste_management',
        ]);
    }

    /**
     * @param  array<int, string>  $columns
     */
    private function rebuild(array $columns): void
    {
        // Identifiers, not values — they cannot be bound. They come from the
        // registry and this file's own literals, never from a request.
        foreach ($columns as $column) {
            if (preg_match('/^[a-z_]+$/', $column) !== 1) {
                throw new InvalidArgumentException("Refusing to interpolate column name: {$column}");
            }
        }

        $qualified = implode(",\n                        ", array_map(fn ($c) => "z.{$c}", $columns));
        $perZone = implode(",\n                    ", array_map(fn ($c) => "z.{$c}", $columns));
        $avgs = implode(",\n                ", array_map(
            fn ($c) => "ROUND(AVG({$c}))::smallint AS {$c}",
            $columns,
        ));
        $total = count($columns);

        DB::statement('DROP MATERIALIZED VIEW IF EXISTS county_vitality_rollup');

        DB::statement(<<<SQL
            CREATE MATERIALIZED VIEW county_vitality_rollup AS
            WITH per_zone AS (
                SELECT
                    z.score,
                    {$perZone},
                    (SELECT COUNT(v) FROM unnest(ARRAY[
                        {$qualified}
                    ]) AS v) AS pillars_present
                FROM zones z
            )
            SELECT
                'nairobi'::varchar(64)                     AS county,
                COUNT(*)::int                              AS zone_count,
                COUNT(*) FILTER (WHERE score IS NOT NULL)::int AS scored_zone_count,
                ROUND(AVG(score))::smallint                AS avg_score,
                MIN(score)::smallint                       AS min_score,
                MAX(score)::smallint                       AS max_score,
                {$avgs},
                COALESCE(SUM(pillars_present), 0)::int     AS pillars_present,
                (COUNT(*) * {$total})::int                 AS pillars_total,
                now()                                      AS refreshed_at
            FROM per_zone
        SQL);

        // REFRESH ... CONCURRENTLY requires a unique index on the view.
        DB::statement('CREATE UNIQUE INDEX county_vitality_rollup_county_idx ON county_vitality_rollup (county)');
    }
};
