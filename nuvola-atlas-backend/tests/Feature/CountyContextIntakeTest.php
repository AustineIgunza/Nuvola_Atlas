<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\CountyContext;
use Tests\TestCase;

/**
 * P9 — POST /api/v1/internal/county-context, the FastAPI-side intake
 * for county/utility readings. Same X-Internal-Secret contract as /v1/ingest.
 */
class CountyContextIntakeTest extends TestCase
{
    private const SECRET_HEADER = 'X-Internal-Secret';

    protected function setUp(): void
    {
        parent::setUp();
        // The internal.secret middleware reads from services.ingest.secret.
        config()->set('services.ingest.secret', 'test-secret');
    }

    public function test_rejects_request_without_internal_secret(): void
    {
        $this->postJson('/api/v1/internal/county-context', [
            'batch_id' => 'test-1',
            'rows' => [],
        ])->assertStatus(401);
    }

    public function test_accepts_and_upserts_a_valid_batch(): void
    {
        $r = $this->withHeader(self::SECRET_HEADER, 'test-secret')
            ->postJson('/api/v1/internal/county-context', [
                'batch_id' => 'wasreb-2026-08-25-1',
                'rows' => [$this->row()],
            ]);

        $r->assertOk()
            ->assertJsonPath('success.data.written', 1)
            ->assertJsonPath('success.data.skipped_retired_pillar', 0);

        $this->assertDatabaseCount('county_context', 1);
        $this->assertDatabaseHas('county_context', [
            'county' => 'Nairobi',
            'indicator_key' => 'non_revenue_water',
            'value' => 48.0,
        ]);
    }

    public function test_replaying_the_same_row_updates_in_place(): void
    {
        $post = fn (float $value) => $this->withHeader(self::SECRET_HEADER, 'test-secret')
            ->postJson('/api/v1/internal/county-context', [
                'batch_id' => 'wasreb-2026-08-25-1',
                'rows' => [$this->row(['value' => $value])],
            ]);

        $post(48.0)->assertOk();
        $post(51.5)->assertOk();

        $this->assertDatabaseCount('county_context', 1);
        $this->assertSame(51.5, (float) CountyContext::query()->value('value'));
    }

    public function test_rejects_a_row_with_subcounty_granularity(): void
    {
        $r = $this->withHeader(self::SECRET_HEADER, 'test-secret')
            ->postJson('/api/v1/internal/county-context', [
                'batch_id' => 'bad-1',
                'rows' => [$this->row(['granularity' => 'subcounty'])],
            ]);

        // Laravel's validator catches this before the service.
        $r->assertStatus(422);
        $this->assertDatabaseCount('county_context', 0);
    }

    public function test_skips_a_retired_pillar_row_and_reports_the_count(): void
    {
        $r = $this->withHeader(self::SECRET_HEADER, 'test-secret')
            ->postJson('/api/v1/internal/county-context', [
                'batch_id' => 'mixed-1',
                'rows' => [
                    $this->row(),
                    $this->row(['pillar_key' => 'civic', 'indicator_key' => 'x']),
                ],
            ]);

        $r->assertOk()
            ->assertJsonPath('success.data.written', 1)
            ->assertJsonPath('success.data.skipped_retired_pillar', 1);

        $this->assertDatabaseCount('county_context', 1);
    }

    /** @param  array<string, mixed>  $overrides */
    private function row(array $overrides = []): array
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
