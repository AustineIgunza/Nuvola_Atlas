<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\CountyContext;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * P9 §Task 1 — GET /api/v1/county-context and the DB-level guards behind it.
 *
 * The endpoint serves the banner above the map. Its correctness rules are:
 *  - only readings for the requested county come back
 *  - unknown county → empty list (not 404 — the county exists, we just
 *    have no data for it yet)
 *  - a retired pillar cannot appear even if a row somehow lingers
 *  - the DB refuses subcounty granularity, gap+value, and non-gap-without-source
 */
class CountyContextApiTest extends TestCase
{
    public function test_returns_readings_for_the_requested_county(): void
    {
        CountyContext::create($this->row([
            'county' => 'Nairobi',
            'indicator_key' => 'non_revenue_water',
            'value' => 48.0,
        ]));
        CountyContext::create($this->row([
            'county' => 'Mombasa',
            'indicator_key' => 'non_revenue_water',
            'value' => 40.0,
        ]));

        $rows = $this->getJson('/api/v1/county-context?county=Nairobi')
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $rows);
        $this->assertSame('Nairobi', $rows[0]['county']);
        // json_encode drops the decimal point on a whole float, so 48.0 comes
        // back over the wire as int 48 and assertSame fails on the type. Cast
        // rather than loosen the comparison — same pattern as
        // CountyContextIntakeTest::test_replaying_the_same_row_updates_in_place.
        $this->assertSame(48.0, (float) $rows[0]['value']);
        $this->assertSame('utility', $rows[0]['granularity']);
        $this->assertSame('wasreb_impact_17', $rows[0]['sourceId']);
        $this->assertSame('FY2023/24', $rows[0]['vintage']);
    }

    public function test_unknown_county_returns_empty_list_not_404(): void
    {
        $this->getJson('/api/v1/county-context?county=Turkana')
            ->assertOk()
            ->assertJsonPath('data', []);
    }

    public function test_default_county_is_nairobi(): void
    {
        CountyContext::create($this->row([
            'county' => 'Nairobi',
            'indicator_key' => 'hours_of_supply',
            'value' => 7.0,
            'unit' => 'hrs/day',
        ]));

        $rows = $this->getJson('/api/v1/county-context')
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $rows);
        $this->assertSame('Nairobi', $rows[0]['county']);
    }

    public function test_a_row_for_a_retired_pillar_is_filtered_out(): void
    {
        // Insert past the DB guard by using the writable columns directly.
        // The row is invalid in the current registry, but a stale batch
        // could put it there — the read layer has to swallow it silently
        // rather than leak a switched-off pillar to the public.
        CountyContext::create($this->row([
            'county' => 'Nairobi',
            'pillar_key' => 'civic',  // retired
            'indicator_key' => 'civic_participation_placeholder',
        ]));

        $this->getJson('/api/v1/county-context?county=Nairobi')
            ->assertOk()
            ->assertJsonPath('data', []);
    }

    public function test_db_refuses_subcounty_granularity(): void
    {
        $this->expectException(\Illuminate\Database\QueryException::class);
        CountyContext::create($this->row([
            'granularity' => 'subcounty',
        ]));
    }

    public function test_db_refuses_gap_with_a_value(): void
    {
        $this->expectException(\Illuminate\Database\QueryException::class);
        CountyContext::create($this->row([
            'method' => 'gap',
            'value' => 0,
            // gap rows still need to satisfy source/vintage rule; blank them.
            'source_id' => null,
            'vintage' => null,
        ]));
    }

    public function test_db_refuses_non_gap_without_source(): void
    {
        $this->expectException(\Illuminate\Database\QueryException::class);
        CountyContext::create($this->row([
            'method' => 'measured',
            'source_id' => null,
        ]));
    }

    public function test_gap_row_with_null_value_is_accepted(): void
    {
        CountyContext::create($this->row([
            'method' => 'gap',
            'value' => null,
            'source_id' => null,
            'vintage' => null,
        ]));

        $rows = $this->getJson('/api/v1/county-context?county=Nairobi')->json('data');
        $this->assertCount(1, $rows);
        $this->assertNull($rows[0]['value']);
        $this->assertSame('gap', $rows[0]['method']);
    }

    /** @param  array<string, mixed>  $overrides */
    private function row(array $overrides): array
    {
        return array_merge([
            'county' => 'Nairobi',
            'pillar_key' => 'water_sanitation',
            'indicator_key' => 'non_revenue_water',
            'value' => 48.0,
            'unit' => 'pct',
            'granularity' => 'utility',
            'method' => 'measured',
            'source_id' => 'wasreb_impact_17',
            'vintage' => 'FY2023/24',
            'retrieved' => '2026-08-24',
            'extraction_confidence' => 'high',
        ], $overrides);
    }
}
