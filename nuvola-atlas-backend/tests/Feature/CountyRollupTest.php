<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Zone;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Phase C county rollup. The materialized view has to agree with
 * ScoreCalculator: pillars are averaged per zone first, then across the
 * county, and a missing indicator is skipped rather than counted as zero.
 */
class CountyRollupTest extends TestCase
{
    public function test_rollup_aggregates_zones_after_a_refresh(): void
    {
        Zone::factory()->create([
            'id' => 'westlands',
            'score' => 70,
            'indicator_healthcare_access' => 60,
            'indicator_education_access' => 60,
            'indicator_digital_connectivity' => 60,
        ]);
        Zone::factory()->create([
            'id' => 'starehe',
            'score' => 50,
            'indicator_healthcare_access' => 80,
            'indicator_education_access' => 80,
            'indicator_digital_connectivity' => 80,
        ]);

        $this->artisan('nuvola:refresh-county-rollup')->assertSuccessful();

        $row = DB::table('county_vitality_rollup')->first();

        $this->assertSame(2, (int) $row->zone_count);
        $this->assertSame(2, (int) $row->scored_zone_count);
        $this->assertSame(60, (int) $row->avg_score);
        $this->assertSame(50, (int) $row->min_score);
        $this->assertSame(70, (int) $row->max_score);
        // social per zone is 60 and 80 → county social is 70.
        $this->assertSame(70, (int) $row->pillar_social);
        $this->assertSame(26, (int) $row->indicators_total);
    }

    public function test_missing_indicators_are_excluded_from_the_pillar_average(): void
    {
        // Two of three social indicators present: the pillar is (90+90)/2,
        // not (90+90+0)/3. Same rule the PHP calculator enforces.
        Zone::factory()->create([
            'id' => 'dagoretti',
            'score' => 55,
            'indicator_healthcare_access' => 90,
            'indicator_education_access' => 90,
            'indicator_digital_connectivity' => null,
        ]);

        $this->artisan('nuvola:refresh-county-rollup')->assertSuccessful();

        $row = DB::table('county_vitality_rollup')->first();

        $this->assertSame(90, (int) $row->pillar_social);
        $this->assertSame(12, (int) $row->indicators_present);
        $this->assertSame(13, (int) $row->indicators_total);
    }

    public function test_county_endpoint_returns_the_rollup(): void
    {
        Zone::factory()->create(['id' => 'kasarani', 'score' => 64]);

        $this->artisan('nuvola:refresh-county-rollup')->assertSuccessful();

        $this->getJson('/api/v1/vitality/county')
            ->assertOk()
            ->assertJsonPath('data.county', 'nairobi')
            ->assertJsonPath('data.zone_count', 1)
            ->assertJsonPath('data.avg_score', 64)
            ->assertJsonStructure([
                'data' => [
                    'county', 'zone_count', 'scored_zone_count',
                    'avg_score', 'min_score', 'max_score',
                    'pillars' => ['social', 'safety', 'density', 'infra'],
                    'indicators_present', 'indicators_total', 'refreshed_at',
                ],
            ]);
    }

    public function test_rollup_is_empty_but_well_formed_with_no_zones(): void
    {
        $this->artisan('nuvola:refresh-county-rollup')->assertSuccessful();

        $this->getJson('/api/v1/vitality/county')
            ->assertOk()
            ->assertJsonPath('data.zone_count', 0)
            ->assertJsonPath('data.avg_score', null)
            ->assertJsonPath('data.pillars.social', null);
    }
}
