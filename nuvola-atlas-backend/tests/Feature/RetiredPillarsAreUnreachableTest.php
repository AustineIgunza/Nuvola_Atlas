<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Zone;
use App\Models\ZoneLayer;
use App\Support\Pillars;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Support\PillarSeeding;
use Tests\TestCase;

/**
 * P1.4 — the backstop for "off means deleted, not flagged".
 *
 * Every other guard in the codebase is a positive assertion about the live
 * pillars. This one is the negative: it sweeps the public read surface and
 * fails if a switched-off key appears anywhere in a response body, including
 * nested inside methodology prose. If someone reintroduces `safety` through a
 * path nobody thought to check, this is what goes red.
 */
class RetiredPillarsAreUnreachableTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seedZone('westlands', 'Westlands');
        $this->seedZone('starehe', 'Starehe');
    }

    private function seedZone(string $id, string $name): Zone
    {
        $zone = Zone::factory()->create(array_merge(
            ['id' => $id, 'name' => $name, 'score' => 70, 'last_sync_min' => 4],
            PillarSeeding::columns(array_fill_keys(Pillars::keys(), 70)),
        ));

        DB::statement(
            'UPDATE zones SET centroid = ST_MakePoint(36.8048, -1.2673)::geography WHERE id = ?',
            [$id]
        );

        return $zone;
    }

    /**
     * Word-boundary match so a retired key can't hide inside a longer token,
     * while `road_density` is not flagged just because it contains "density".
     */
    private function assertNamesNoRetiredPillar(TestResponse $response, string $label): void
    {
        $body = $response->getContent();
        $this->assertNotFalse($body, "{$label} returned no body.");

        foreach (Pillars::retiredKeys() as $retired) {
            $this->assertDoesNotMatchRegularExpression(
                '/\b'.preg_quote($retired, '/').'\b/i',
                $body,
                "{$label} leaked the switched-off pillar '{$retired}'."
            );
        }
    }

    /** @return array<string, array{string}> */
    public static function publicReadEndpoints(): array
    {
        return [
            'zone index' => ['/api/v1/zones'],
            'zone show' => ['/api/v1/zones/westlands'],
            'zone layers' => ['/api/v1/zones/westlands/layers'],
            'zone history' => ['/api/v1/zones/westlands/history'],
            'zone forecast' => ['/api/v1/zones/westlands/forecast'],
            'zone activity' => ['/api/v1/zones/westlands/activity'],
            'project index' => ['/api/v1/projects'],
            'alert index' => ['/api/v1/alerts'],
            'history' => ['/api/v1/history'],
            'methodology' => ['/api/v1/vitality/methodology'],
            'county rollup' => ['/api/v1/vitality/county'],
        ];
    }

    #[DataProvider('publicReadEndpoints')]
    public function test_a_public_read_endpoint_never_names_a_retired_pillar(string $url): void
    {
        $response = $this->getJson($url);

        $response->assertOk();
        $this->assertNamesNoRetiredPillar($response, $url);
    }

    public function test_the_registry_actually_has_retired_keys_to_check_for(): void
    {
        // Without this the whole suite would pass vacuously if retiredKeys()
        // ever started returning an empty array.
        $this->assertNotEmpty(Pillars::retiredKeys());
        $this->assertContains('safety', Pillars::retiredKeys());
    }

    /**
     * Only TXT is asserted against. The PDF is deflate-compressed by Dompdf and
     * the DOCX is a zip, so a byte scan of either would pass without proving
     * anything. TXT carries the same pillar rows as the other two.
     */
    public function test_the_zone_report_never_names_a_retired_pillar(): void
    {
        $response = $this->get('/api/v1/zones/westlands/export?format=txt');

        $response->assertOk();
        $this->assertNamesNoRetiredPillar($response, 'export.txt');
    }

    /**
     * The strongest form of "deleted, not flagged": a retired pillar can't even
     * be stored as a layer, so no serving code has to remember to filter it.
     */
    public function test_a_zone_layer_named_after_a_retired_pillar_is_rejected_by_the_database(): void
    {
        $this->expectException(QueryException::class);

        ZoneLayer::create([
            'zone_id' => 'westlands',
            'layer_type' => 'safety',
            'geojson' => ['type' => 'FeatureCollection', 'features' => []],
        ]);
    }
}
