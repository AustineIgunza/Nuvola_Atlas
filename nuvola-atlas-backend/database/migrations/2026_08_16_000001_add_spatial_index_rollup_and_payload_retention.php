<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // `zones.boundary` got a GIST index in 2026_05_25_000003; `centroid`
        // never did, so every ST_DWithin / nearest-zone probe sequential-scans.
        DB::statement('CREATE INDEX zones_centroid_gist ON zones USING GIST (centroid)');

        // Pillar means are computed per zone first and only then averaged
        // across the county. Pooling all indicator values into one AVG would
        // silently weight pillars by indicator count (infra has 4, the rest
        // have 3) and disagree with ScoreCalculator. AVG over unnest() skips
        // NULLs, which is the same "missing is excluded, never zero" rule.
        DB::statement(<<<'SQL'
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
                'nairobi'::varchar(64)                  AS county,
                COUNT(*)::int                           AS zone_count,
                COUNT(*) FILTER (WHERE score > 0)::int  AS scored_zone_count,
                ROUND(AVG(NULLIF(score, 0)))::smallint  AS avg_score,
                MIN(NULLIF(score, 0))::smallint         AS min_score,
                MAX(NULLIF(score, 0))::smallint         AS max_score,
                ROUND(AVG(pillar_social))::smallint     AS pillar_social,
                ROUND(AVG(pillar_safety))::smallint     AS pillar_safety,
                ROUND(AVG(pillar_density))::smallint    AS pillar_density,
                ROUND(AVG(pillar_infra))::smallint      AS pillar_infra,
                COALESCE(SUM(indicators_present), 0)::int AS indicators_present,
                (COUNT(*) * 13)::int                    AS indicators_total,
                now()                                   AS refreshed_at
            FROM per_zone
        SQL);

        // REFRESH ... CONCURRENTLY requires a unique index on the view.
        DB::statement('CREATE UNIQUE INDEX county_vitality_rollup_county_idx ON county_vitality_rollup (county)');

        DB::statement('ALTER TABLE data_ingestion_logs ADD COLUMN payload_purged_at timestamp NULL');

        DB::statement(<<<'SQL'
            CREATE INDEX data_ingestion_logs_pending_purge_idx
                ON data_ingestion_logs (received_at)
                WHERE payload IS NOT NULL AND payload_purged_at IS NULL
        SQL);

        // The original trigger blocked every UPDATE, which makes the 30-day
        // raw-payload retention rule impossible to honour without dropping
        // append-only altogether. Instead the function now permits exactly
        // one shape of mutation — payload NOT NULL -> NULL paired with
        // payload_purged_at NULL -> NOT NULL and no other column moving.
        // DELETE stays permanently blocked; the analytical outcome of every
        // row (accepted, status, indicators_updated) is untouchable.
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION enforce_logs_append_only()
            RETURNS TRIGGER AS $$
            BEGIN
                IF TG_OP = 'DELETE' THEN
                    RAISE EXCEPTION 'data_ingestion_logs is append-only; rows may never be deleted.';
                END IF;

                IF OLD.payload IS NOT NULL
                   AND NEW.payload IS NULL
                   AND OLD.payload_purged_at IS NULL
                   AND NEW.payload_purged_at IS NOT NULL
                   AND (to_jsonb(NEW) - 'payload' - 'payload_purged_at')
                     = (to_jsonb(OLD) - 'payload' - 'payload_purged_at')
                THEN
                    RETURN NEW;
                END IF;

                RAISE EXCEPTION 'data_ingestion_logs is append-only; the only permitted update is retention redaction of payload.';
            END;
            $$ LANGUAGE plpgsql;
        SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION enforce_logs_append_only()
            RETURNS TRIGGER AS $$
            BEGIN
                RAISE EXCEPTION 'data_ingestion_logs table is append-only.';
            END;
            $$ LANGUAGE plpgsql;
        SQL);

        DB::statement('DROP INDEX IF EXISTS data_ingestion_logs_pending_purge_idx');
        DB::statement('ALTER TABLE data_ingestion_logs DROP COLUMN IF EXISTS payload_purged_at');
        DB::statement('DROP MATERIALIZED VIEW IF EXISTS county_vitality_rollup');
        DB::statement('DROP INDEX IF EXISTS zones_centroid_gist');
    }
};
