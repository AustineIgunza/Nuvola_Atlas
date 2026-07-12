-- Emergency schema fix: the migrations table on staging is empty, so the
-- pillars → indicators swap never ran. This script applies just that
-- migration's DDL and inserts a record so future `artisan migrate` calls
-- do not attempt to re-apply it (or the earlier migrations that already
-- exist in the DB).
--
-- Idempotent — `ADD COLUMN IF NOT EXISTS` and `DROP COLUMN IF EXISTS`
-- so re-running is safe.

BEGIN;

-- 13 indicator columns on zones (nullable smallint 0-100).
ALTER TABLE zones ADD COLUMN IF NOT EXISTS indicator_healthcare_access smallint NULL;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS indicator_education_access smallint NULL;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS indicator_digital_connectivity smallint NULL;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS indicator_crime_rates smallint NULL;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS indicator_emergency_response_access smallint NULL;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS indicator_disaster_exposure smallint NULL;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS indicator_population_density smallint NULL;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS indicator_congestion smallint NULL;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS indicator_housing_pressure smallint NULL;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS indicator_road_quality smallint NULL;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS indicator_energy_reliability smallint NULL;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS indicator_food_risk smallint NULL;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS indicator_waste_management smallint NULL;

-- Same 13 on zone_score_snapshots.
ALTER TABLE zone_score_snapshots ADD COLUMN IF NOT EXISTS indicator_healthcare_access smallint NULL;
ALTER TABLE zone_score_snapshots ADD COLUMN IF NOT EXISTS indicator_education_access smallint NULL;
ALTER TABLE zone_score_snapshots ADD COLUMN IF NOT EXISTS indicator_digital_connectivity smallint NULL;
ALTER TABLE zone_score_snapshots ADD COLUMN IF NOT EXISTS indicator_crime_rates smallint NULL;
ALTER TABLE zone_score_snapshots ADD COLUMN IF NOT EXISTS indicator_emergency_response_access smallint NULL;
ALTER TABLE zone_score_snapshots ADD COLUMN IF NOT EXISTS indicator_disaster_exposure smallint NULL;
ALTER TABLE zone_score_snapshots ADD COLUMN IF NOT EXISTS indicator_population_density smallint NULL;
ALTER TABLE zone_score_snapshots ADD COLUMN IF NOT EXISTS indicator_congestion smallint NULL;
ALTER TABLE zone_score_snapshots ADD COLUMN IF NOT EXISTS indicator_housing_pressure smallint NULL;
ALTER TABLE zone_score_snapshots ADD COLUMN IF NOT EXISTS indicator_road_quality smallint NULL;
ALTER TABLE zone_score_snapshots ADD COLUMN IF NOT EXISTS indicator_energy_reliability smallint NULL;
ALTER TABLE zone_score_snapshots ADD COLUMN IF NOT EXISTS indicator_food_risk smallint NULL;
ALTER TABLE zone_score_snapshots ADD COLUMN IF NOT EXISTS indicator_waste_management smallint NULL;

-- Drop the legacy pillar / delta columns if they still exist. They were
-- meant to be removed by the same migration.
ALTER TABLE zones DROP COLUMN IF EXISTS pillar_social;
ALTER TABLE zones DROP COLUMN IF EXISTS pillar_safety;
ALTER TABLE zones DROP COLUMN IF EXISTS pillar_density;
ALTER TABLE zones DROP COLUMN IF EXISTS pillar_infra;
ALTER TABLE zones DROP COLUMN IF EXISTS delta_social;
ALTER TABLE zones DROP COLUMN IF EXISTS delta_safety;
ALTER TABLE zones DROP COLUMN IF EXISTS delta_density;
ALTER TABLE zones DROP COLUMN IF EXISTS delta_infra;

ALTER TABLE zone_score_snapshots DROP COLUMN IF EXISTS pillar_social;
ALTER TABLE zone_score_snapshots DROP COLUMN IF EXISTS pillar_safety;
ALTER TABLE zone_score_snapshots DROP COLUMN IF EXISTS pillar_density;
ALTER TABLE zone_score_snapshots DROP COLUMN IF EXISTS pillar_infra;

-- Record every migration that lives in the repo as already applied. The
-- tables already exist on this DB, so a future `artisan migrate` would
-- otherwise try to re-create them and 500 on "duplicate table". Doing
-- this here lets the app boot cleanly.
INSERT INTO migrations (migration, batch) VALUES
    ('0001_01_01_000000_create_users_table', 1),
    ('0001_01_01_000001_create_cache_table', 1),
    ('0001_01_01_000002_create_jobs_table', 1),
    ('2026_05_24_200716_create_personal_access_tokens_table', 1),
    ('2026_05_24_210000_enable_postgis', 1),
    ('2026_05_24_210001_create_zones_table', 1),
    ('2026_05_24_210002_create_projects_table', 1),
    ('2026_05_24_210003_create_alerts_table', 1),
    ('2026_05_24_210004_create_reports_table', 1),
    ('2026_05_24_210005_create_vitality_history_table', 1),
    ('2026_05_24_210006_create_activities_table', 1),
    ('2026_05_25_000001_add_boundary_to_zones_table', 1),
    ('2026_05_25_000002_create_zone_layers_table', 1),
    ('2026_05_25_000003_add_indexes_to_zone_layers', 1),
    ('2026_05_25_100001_add_role_to_users_table', 1),
    ('2026_05_25_100002_add_indexes_to_tables', 1),
    ('2026_05_25_100003_add_soft_deletes_to_alerts_and_reports', 1),
    ('2026_06_04_120000_create_audit_logs_table', 1),
    ('2026_06_05_120000_create_partners_and_overlays_with_rls', 1),
    ('2026_06_05_140000_add_two_factor_columns_to_users', 1),
    ('2026_06_05_160000_swap_totp_for_email_two_factor', 1),
    ('2026_06_08_120000_add_two_factor_reminder_columns_to_users', 1),
    ('2026_06_09_120000_add_rate_limit_to_personal_access_tokens', 1),
    ('2026_07_08_000001_create_zone_score_snapshots_table', 1),
    ('2026_07_09_000001_create_chat_readonly_role', 1),
    ('2026_07_09_000002_create_chat_conversations_table', 1),
    ('2026_07_25_000001_swap_pillars_for_indicators', 1)
ON CONFLICT (migration) DO NOTHING;

COMMIT;
