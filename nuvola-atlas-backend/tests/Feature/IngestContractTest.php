<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Jobs\RecalculateZoneScore;
use App\Models\DataIngestionLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Tests\Support\IndicatorSeeding;
use Tests\TestCase;

/**
 * Wire-level contract for the FastAPI -> Laravel hop. The signing scheme
 * mirrored here must stay in lockstep with
 * nuvola-atlas-ingestion/app/signing.py — if one side changes, this test
 * is the thing that should go red.
 */
class IngestContractTest extends TestCase
{
    private const SECRET = 'test-internal-secret-value-that-is-long-enough-000';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.ingest.secret' => self::SECRET]);
        $this->seedZone('westlands');
    }

    private function seedZone(string $id, int $pillar = 70): void
    {
        $indicators = IndicatorSeeding::fromPillars([
            'social' => $pillar,
            'safety' => $pillar,
            'density' => $pillar,
            'infra' => $pillar,
        ]);
        $cols = implode(', ', array_keys($indicators));
        $vals = implode(', ', array_fill(0, count($indicators), '?'));

        DB::statement(
            "INSERT INTO zones (id, name, score, {$cols}, last_sync_min,
             centroid, created_at, updated_at)
             VALUES (?, ?, ?, {$vals}, 5,
             ST_GeogFromText('POINT(36.82 -1.29)'), now(), now())",
            array_merge([$id, ucfirst($id), $pillar], array_values($indicators))
        );
    }

    /** @param array<string, mixed> $payload */
    private function signedHeaders(array $payload, ?int $timestamp = null, ?string $secret = null): array
    {
        $timestamp ??= time();
        $body = $this->encode($payload);
        $signature = 'sha256='.hash_hmac('sha256', $timestamp.'.'.$body, $secret ?? self::SECRET);

        return [
            'X-Internal-Secret' => $secret ?? self::SECRET,
            'X-Internal-Timestamp' => (string) $timestamp,
            'X-Internal-Signature' => $signature,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];
    }

    /** @param array<string, mixed> $payload */
    private function encode(array $payload): string
    {
        return json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    /** @return array<string, mixed> */
    private function payload(): array
    {
        return [
            'source' => 'fastapi.daystar',
            'zone_id' => 'westlands',
            'indicators' => ['healthcare_access' => 82, 'digital_connectivity' => 64],
        ];
    }

    /** @param array<string, string> $headers */
    private function postSigned(array $payload, array $headers)
    {
        return $this->call(
            'POST',
            '/api/v1/ingest',
            [],
            [],
            [],
            $this->transformHeadersToServerVars($headers),
            $this->encode($payload)
        );
    }

    public function test_correctly_signed_request_is_accepted(): void
    {
        Queue::fake();
        $payload = $this->payload();

        $this->postSigned($payload, $this->signedHeaders($payload))
            ->assertStatus(202)
            ->assertJsonPath('ok', true)
            ->assertJsonPath('indicators_updated', 2);

        $this->assertSame(82, (int) DB::table('zones')->where('id', 'westlands')->value('indicator_healthcare_access'));
        Queue::assertPushed(RecalculateZoneScore::class);
    }

    public function test_tampered_body_is_rejected_with_401(): void
    {
        $payload = $this->payload();
        $headers = $this->signedHeaders($payload);

        // Signature was minted over healthcare_access=82; ship 100 instead.
        $payload['indicators']['healthcare_access'] = 100;

        $this->postSigned($payload, $headers)->assertStatus(401);

        $this->assertSame(70, (int) DB::table('zones')->where('id', 'westlands')->value('indicator_healthcare_access'));
        $this->assertSame(0, DataIngestionLog::count());
    }

    public function test_missing_signature_headers_are_rejected(): void
    {
        $payload = $this->payload();

        $this->postSigned($payload, [
            'X-Internal-Secret' => self::SECRET,
            'Accept' => 'application/json',
        ])->assertStatus(401);
    }

    public function test_wrong_secret_is_rejected(): void
    {
        $payload = $this->payload();

        $this->postSigned($payload, $this->signedHeaders($payload, null, 'not-the-secret'))
            ->assertStatus(401);
    }

    public function test_stale_timestamp_is_rejected(): void
    {
        $payload = $this->payload();

        $this->postSigned($payload, $this->signedHeaders($payload, time() - 3600))
            ->assertStatus(401);
    }

    public function test_rejection_uses_the_rfc7807_envelope(): void
    {
        $payload = $this->payload();

        $response = $this->postSigned($payload, ['Accept' => 'application/json']);

        $response->assertStatus(401)
            ->assertJsonStructure(['type', 'title', 'status', 'detail', 'instance']);

        $this->assertStringContainsString(
            'application/problem+json',
            (string) $response->headers->get('Content-Type')
        );
    }

    public function test_unknown_indicator_slugs_are_ignored_not_written(): void
    {
        Queue::fake();
        $payload = $this->payload();
        $payload['indicators']['definitely_not_an_indicator'] = 50;

        $this->postSigned($payload, $this->signedHeaders($payload))
            ->assertStatus(202)
            ->assertJsonPath('indicators_updated', 2)
            ->assertJsonPath('ignored', ['definitely_not_an_indicator']);
    }

    public function test_out_of_range_values_are_ignored(): void
    {
        Queue::fake();
        $payload = [
            'source' => 'fastapi.daystar',
            'zone_id' => 'westlands',
            'indicators' => ['healthcare_access' => 900],
        ];

        $this->postSigned($payload, $this->signedHeaders($payload))
            ->assertStatus(422)
            ->assertJsonPath('ok', false);

        $this->assertSame(70, (int) DB::table('zones')->where('id', 'westlands')->value('indicator_healthcare_access'));
    }
}
