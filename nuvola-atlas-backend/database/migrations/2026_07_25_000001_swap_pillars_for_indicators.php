<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Vitality Overhaul (July 2026): drop the 4 pillar/delta storage columns
 * and replace with 13 nullable indicator columns backing the new
 * scoring model. Same swap applies to zone_score_snapshots so the
 * time-series chart continues to render historical per-indicator values.
 *
 * Nullable is the whole point — indicators arrive incrementally via
 * Daystar drops. A null indicator is EXCLUDED from the pillar average,
 * NEVER treated as zero (see ScoreCalculator).
 */
return new class extends Migration
{
    /** @return array<int, string> */
    private function indicatorColumns(): array
    {
        return [
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
        ];
    }

    public function up(): void
    {
        Schema::table('zones', function (Blueprint $table) {
            foreach ($this->indicatorColumns() as $col) {
                $table->smallInteger($col)->nullable();
            }
        });

        Schema::table('zone_score_snapshots', function (Blueprint $table) {
            foreach ($this->indicatorColumns() as $col) {
                $table->smallInteger($col)->nullable();
            }
        });

        // Legacy pillar/delta storage — drop after adding indicators so
        // rows keep working during the transition. Nothing references
        // these once ScoreCalculator's rewrite is deployed.
        Schema::table('zones', function (Blueprint $table) {
            $table->dropColumn([
                'pillar_social', 'pillar_safety', 'pillar_density', 'pillar_infra',
                'delta_social', 'delta_safety', 'delta_density', 'delta_infra',
            ]);
        });

        Schema::table('zone_score_snapshots', function (Blueprint $table) {
            $table->dropColumn([
                'pillar_social', 'pillar_safety', 'pillar_density', 'pillar_infra',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('zones', function (Blueprint $table) {
            $table->integer('pillar_social')->default(0);
            $table->integer('pillar_safety')->default(0);
            $table->integer('pillar_density')->default(0);
            $table->integer('pillar_infra')->default(0);
            $table->integer('delta_social')->default(0);
            $table->integer('delta_safety')->default(0);
            $table->integer('delta_density')->default(0);
            $table->integer('delta_infra')->default(0);
        });

        Schema::table('zone_score_snapshots', function (Blueprint $table) {
            $table->smallInteger('pillar_social')->default(0);
            $table->smallInteger('pillar_safety')->default(0);
            $table->smallInteger('pillar_density')->default(0);
            $table->smallInteger('pillar_infra')->default(0);
        });

        Schema::table('zones', function (Blueprint $table) {
            $table->dropColumn($this->indicatorColumns());
        });
        Schema::table('zone_score_snapshots', function (Blueprint $table) {
            $table->dropColumn($this->indicatorColumns());
        });
    }
};
