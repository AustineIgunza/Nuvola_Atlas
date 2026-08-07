<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Zone;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class HttpCacheTest extends TestCase
{
    public function test_zones_response_includes_etag_and_cache_control(): void
    {
        Zone::factory()->count(2)->create();

        $response = $this->getJson('/api/v1/zones')->assertOk();

        $etag = $response->headers->get('ETag');
        $cacheControl = $response->headers->get('Cache-Control');

        $this->assertNotNull($etag, 'Expected ETag header on /zones');
        $this->assertMatchesRegularExpression('/^"[a-f0-9]{32}"$/', $etag);

        $this->assertNotNull($cacheControl, 'Expected Cache-Control header on /zones');
        $this->assertStringContainsString('private', $cacheControl);
        $this->assertStringContainsString('max-age=300', $cacheControl);
    }

    public function test_zones_returns_304_when_if_none_match_matches(): void
    {
        Zone::factory()->count(2)->create();

        $first = $this->getJson('/api/v1/zones')->assertOk();
        $etag = $first->headers->get('ETag');

        $second = $this->getJson('/api/v1/zones', ['If-None-Match' => $etag]);

        $second->assertStatus(304);
        $this->assertSame('', $second->getContent());
        $this->assertSame($etag, $second->headers->get('ETag'));
        $this->assertStringContainsString('max-age=300', (string) $second->headers->get('Cache-Control'));
    }

    public function test_zones_returns_full_body_when_if_none_match_does_not_match(): void
    {
        Zone::factory()->count(2)->create();

        $response = $this->getJson('/api/v1/zones', ['If-None-Match' => '"deadbeef-not-the-real-etag"'])
            ->assertOk();

        $this->assertNotSame('', $response->getContent());
        $this->assertNotNull($response->headers->get('ETag'));
    }

    public function test_zones_returns_304_with_wildcard_if_none_match(): void
    {
        Zone::factory()->count(2)->create();

        $response = $this->getJson('/api/v1/zones', ['If-None-Match' => '*']);
        $response->assertStatus(304);
    }

    public function test_projects_endpoint_also_carries_cache_headers(): void
    {
        $response = $this->getJson('/api/v1/projects')->assertOk();

        $this->assertNotNull($response->headers->get('ETag'));
        $this->assertStringContainsString('max-age=300', (string) $response->headers->get('Cache-Control'));
    }

    public function test_alerts_endpoint_does_not_carry_cache_headers(): void
    {
        // /alerts is real-time and explicitly outside the http.cache group.
        $response = $this->getJson('/api/v1/alerts')->assertOk();

        $this->assertNull($response->headers->get('ETag'));
        $cacheControl = (string) $response->headers->get('Cache-Control', '');
        $this->assertStringNotContainsString('max-age=300', $cacheControl);
    }

    public function test_zones_survives_a_serializing_cache_store(): void
    {
        // Every other test here runs on the array store, which hands the
        // cached value straight back without serializing. Real deployments
        // use file/redis, where a cached Eloquent paginator failed to
        // rehydrate and every request after the first 500'd.
        config(['cache.default' => 'file']);
        Cache::store('file')->flush();

        Zone::factory()->count(2)->create();

        $this->getJson('/api/v1/zones')->assertOk();
        $this->getJson('/api/v1/zones')->assertOk()->assertJsonStructure(['data', 'links', 'meta']);

        Cache::store('file')->flush();
    }

    public function test_etag_changes_when_underlying_data_changes(): void
    {
        Zone::factory()->create();
        $first = $this->getJson('/api/v1/zones')->assertOk();
        $etagBefore = $first->headers->get('ETag');

        // Drop the cached zones page so the next request reflects the new zone.
        \Illuminate\Support\Facades\Cache::flush();

        Zone::factory()->create(['name' => 'Just Added Ward']);
        $second = $this->getJson('/api/v1/zones')->assertOk();
        $etagAfter = $second->headers->get('ETag');

        $this->assertNotSame($etagBefore, $etagAfter);
    }
}
