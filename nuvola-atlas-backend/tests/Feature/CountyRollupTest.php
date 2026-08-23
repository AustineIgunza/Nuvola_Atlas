<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Zone;
use App\Support\Pillars;
use Illuminate\Support\Facades\DB;
use Tests\Support\PillarSeeding;
use Tests\TestCase;

/**
 * Phase C county rollup. The materialized view has to agree with
 * ScoreCalculator: a pillar is averaged across the zones that report it, and
 * a zone with no reading is skipped rather than counted as zero.
 */
class CountyRollupTest extends TestCase
{
    public function test_rollup_aggregates_zones_after_a_refresh(): void
    {
        Zone::factory()->create(array_merge(
            ['id' => 'westlands', 'score' => 70],
            PillarSeeding::columns(array_fill_keys(Pillars::keys(), 60)),
        ));
        Zone::factory()->create(array_merge(
            ['id' => 'starehe', 'score' => 50],
            PillarSeeding::columns(array_fill_keys(Pillars::keys(), 80)),
        ));

        $this->artisan('nuvola:refresh-county-rollup')->assertSuccessful();

        $row = DB::table('county_vitality_rollup')->first();

        $this->assertSame(2, (int) $row->zone_count);
        $this->assertSame(2, (int) $row->scored_zone_count);
        $this->assertSame(60, (int) $row->avg_score);
        $this->assertSame(50, (int) $row->min_score);
        $this->assertSame(70, (int) $row->max_score);
        // Water is 60 in one zone and 80 in the other → county water is 70.
        $this->assertSame(70, (int) $row->pillar_water_sanitation);
        $this->assertSame(2 * count(Pillars::keys()), (int) $row->pillars_total);
    }

    public function test_a_missing_pillar_is_excluded_from_the_county_average(): void
    {
        Zone::factory()->create(array_merge(
            ['id' => 'dagoretti', 'score' => 55],
            PillarSeeding::columns(array_fill_keys(Pillars::keys(), 90)),
            PillarSeeding::columns(['transit_access' => null]),
        ));
        Zone::factory()->create(array_merge(
            ['id' => 'kamukunji', 'score' => 55],
            PillarSeeding::columns(array_fill_keys(Pillars::keys(), 70)),
        ));

        $this->artisan('nuvola:refresh-county-rollup')->assertSuccessful();

        $row = DB::table('county_vitality_rollup')->first();

        // Only Kamukunji reports transit, so the county transit figure is its
        // 70 — not (70+0)/2. Averaging a gap in as a zero would understate
        // the county and make a data outage look like a service collapse.
        $this->assertSame(70, (int) $row->pillar_transit_access);
        $this->assertSame(80, (int) $row->pillar_water_sanitation);
        $this->assertSame(2 * count(Pillars::keys()) - 1, (int) $row->pillars_present);
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
                    'pillars' => Pillars::keys(),
                    'pillars_present', 'pillars_total', 'refreshed_at',
                ],
            ]);
    }

    public function test_county_endpoint_names_no_retired_pillar(): void
    {
        Zone::factory()->create(['id' => 'kasarani', 'score' => 64]);
        $this->artisan('nuvola:refresh-county-rollup')->assertSuccessful();

        $pillars = $this->getJson('/api/v1/vitality/county')->json('data.pillars');

        $this->assertSame([], array_intersect(array_keys($pillars), Pillars::retiredKeys()));
    }

    public function test_rollup_is_empty_but_well_formed_with_no_zones(): void
    {
        $this->artisan('nuvola:refresh-county-rollup')->assertSuccessful();

        $this->getJson('/api/v1/vitality/county')
            ->assertOk()
            ->assertJsonPath('data.zone_count', 0)
            ->assertJsonPath('data.avg_score', null)
            ->assertJsonPath('data.pillars.water_sanitation', null);
    }
}
