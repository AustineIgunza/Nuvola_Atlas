<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\DataIngestionLog;
use App\Models\Zone;
use App\Jobs\RecalculateZoneScore;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class IngestApiTest extends TestCase
{
    private string $secret = 'super_secret_token_that_is_at_least_48_characters_long_for_validation';

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'ingestion.internal_secret' => $this->secret,
            'services.ingest.secret' => $this->secret,
        ]);
    }

    /**
     * Helper to create a spatial zone in test DB.
     */
    private function createTestZone(string $id): Zone
    {
        DB::statement(
            "INSERT INTO zones (id, name, score, last_sync_min, centroid, created_at, updated_at)
             VALUES (?, ?, 0, 99, ST_GeogFromText('POINT(36.82 -1.29)'), now(), now())",
            [$id, 'Test Zone']
        );
        return Zone::find($id);
    }

    public function test_missing_secret_returns_401(): void
    {
        $response = $this->postJson('/api/v1/ingest', []);
        $response->assertStatus(401);
    }

    public function test_short_secret_returns_401(): void
    {
        $response = $this->withHeaders([
            'X-Internal-Secret' => 'too_short'
        ])->postJson('/api/v1/ingest', []);

        $response->assertStatus(401);
    }

    public function test_invalid_secret_returns_401(): void
    {
        $response = $this->withHeaders([
            'X-Internal-Secret' => 'invalid_secret_that_is_long_enough_but_does_not_match_at_all_123456789'
        ])->postJson('/api/v1/ingest', []);

        $response->assertStatus(401);
    }

    public function test_valid_secret_with_validation_errors_returns_422_and_logs_rejection(): void
    {
        $payload = [
            'batch_id' => 'test-batch',
            'submitted_at' => now()->toIso8601String(),
            'readings' => [
                [
                    'zone_id' => 'non-existent-zone',
                    'indicator' => 'healthcare_access',
                    'value' => 75.2,
                    'observed_at' => now()->toIso8601String(),
                ]
            ]
        ];

        $response = $this->withHeaders([
            'X-Internal-Secret' => $this->secret
        ])->postJson('/api/v1/ingest', $payload);

        $response->assertStatus(422);

        // Assert log is created in the append-only logs table with rejected status
        $hash = hash('sha256', json_encode($payload));
        $this->assertTrue(DataIngestionLog::where('payload_hash', $hash)->exists());
        $log = DataIngestionLog::where('payload_hash', $hash)->first();
        $this->assertSame('rejected', $log->status);
        $this->assertNotNull($log->error_reasons);
    }

    public function test_valid_raw_secret_applies_data_successfully(): void
    {
        Queue::fake();

        $zone = $this->createTestZone('westlands');

        $payload = [
            'batch_id' => 'test-batch-success',
            'submitted_at' => now()->toIso8601String(),
            'readings' => [
                [
                    'zone_id' => 'westlands',
                    'indicator' => 'healthcare_access',
                    'value' => 85.4,
                    'observed_at' => now()->toIso8601String(),
                ],
                [
                    'zone_id' => 'westlands',
                    'indicator' => 'emergency_response', // translates to emergency_response_access
                    'value' => 60.1,
                    'observed_at' => now()->toIso8601String(),
                ]
            ]
        ];

        $response = $this->withHeaders([
            'X-Internal-Secret' => $this->secret
        ])->postJson('/api/v1/ingest', $payload);

        $response->assertStatus(200);

        // Verify indicators saved and rounded correctly
        $zone->refresh();
        $this->assertSame(85, $zone->indicator_healthcare_access);
        $this->assertSame(60, $zone->indicator_emergency_response_access);

        // Verify log created
        $hash = hash('sha256', json_encode($payload));
        $this->assertTrue(DataIngestionLog::where('payload_hash', $hash)->exists());
        $log = DataIngestionLog::where('payload_hash', $hash)->first();
        $this->assertSame('applied', $log->status);
        $this->assertSame(1, $log->zone_count);
        $this->assertSame(2, $log->indicator_count);

        // Verify async job queued
        Queue::assertPushed(RecalculateZoneScore::class, function ($job) {
            return $job->zoneId === 'westlands';
        });
    }

    public function test_valid_hmac_signature_applies_data_successfully(): void
    {
        Queue::fake();
        $zone = $this->createTestZone('starehe');

        $payload = [
            'batch_id' => 'test-batch-hmac',
            'submitted_at' => now()->toIso8601String(),
            'readings' => [
                [
                    'zone_id' => 'starehe',
                    'indicator' => 'healthcare_access',
                    'value' => 90,
                    'observed_at' => now()->toIso8601String(),
                ]
            ]
        ];

        $body = json_encode($payload);
        $signature = hash_hmac('sha256', $body, $this->secret);

        $response = $this->withHeaders([
            'X-Internal-Secret' => $signature
        ])->postJson('/api/v1/ingest', $payload);

        $response->assertStatus(200);

        $zone->refresh();
        $this->assertSame(90, $zone->indicator_healthcare_access);
    }

    public function test_idempotency_prevents_double_processing(): void
    {
        Queue::fake();
        $this->createTestZone('kibra');

        $payload = [
            'batch_id' => 'test-batch-idempotency',
            'submitted_at' => now()->toIso8601String(),
            'readings' => [
                [
                    'zone_id' => 'kibra',
                    'indicator' => 'congestion',
                    'value' => 45.8,
                    'observed_at' => now()->toIso8601String(),
                ]
            ]
        ];

        // Process first time
        $response1 = $this->withHeaders([
            'X-Internal-Secret' => $this->secret
        ])->postJson('/api/v1/ingest', $payload);
        $response1->assertStatus(200);

        // Process second time (should trigger short-circuit success)
        $response2 = $this->withHeaders([
            'X-Internal-Secret' => $this->secret
        ])->postJson('/api/v1/ingest', $payload);

        $response2->assertStatus(200);
        $this->assertStringContainsString('Idempotent batch already processed', $response2->json('message'));
        $this->assertSame(1, DataIngestionLog::where('source', 'test-batch-idempotency')->count());
    }

    public function test_model_updates_are_blocked_on_logs_table(): void
    {
        $log = DataIngestionLog::create([
            'source' => 'test-audit',
            'payload_hash' => 'hash123',
            'arrived_at' => now(),
            'status' => 'applied',
        ]);

        try {
            $log->update(['status' => 'rejected']);
            $this->fail('Model was updated despite append-only constraints');
        } catch (\Throwable $e) {
            $this->assertStringContainsString('append-only', $e->getMessage());
        }
    }

    public function test_model_deletions_are_blocked_on_logs_table(): void
    {
        $log = DataIngestionLog::create([
            'source' => 'test-audit',
            'payload_hash' => 'hash123',
            'arrived_at' => now(),
            'status' => 'applied',
        ]);

        try {
            $log->delete();
            $this->fail('Model was deleted despite append-only constraints');
        } catch (\Throwable $e) {
            $this->assertStringContainsString('append-only', $e->getMessage());
        }
    }

    public function test_db_trigger_updates_are_blocked_on_logs_table(): void
    {
        $log = DataIngestionLog::create([
            'source' => 'test-audit',
            'payload_hash' => 'hash123',
            'arrived_at' => now(),
            'status' => 'applied',
        ]);

        try {
            DB::statement("UPDATE data_ingestion_logs SET status = 'rejected' WHERE id = ?", [$log->id]);
            $this->fail('Database trigger allowed update');
        } catch (\Illuminate\Database\QueryException $e) {
            $this->assertStringContainsString('append-only', $e->getMessage());
        }
    }

    public function test_db_trigger_deletions_are_blocked_on_logs_table(): void
    {
        $log = DataIngestionLog::create([
            'source' => 'test-audit',
            'payload_hash' => 'hash123',
            'arrived_at' => now(),
            'status' => 'applied',
        ]);

        try {
            DB::statement("DELETE FROM data_ingestion_logs WHERE id = ?", [$log->id]);
            $this->fail('Database trigger allowed delete');
        } catch (\Illuminate\Database\QueryException $e) {
            $this->assertStringContainsString('append-only', $e->getMessage());
        }
    }
}
