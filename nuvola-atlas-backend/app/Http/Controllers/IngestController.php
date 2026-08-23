<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\IngestBatchRequest;
use App\Jobs\RecalculateZoneScore;
use App\Models\DataIngestionLog;
use App\Models\Zone;
use App\Support\Audit;
use App\Support\Pillars;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class IngestController extends Controller
{
    /**
     * Process an incoming cleaned batch of pillar readings.
     */
    public function ingest(IngestBatchRequest $request): JsonResponse
    {
        $body = $request->getContent();
        $hash = hash('sha256', $body);
        $batchId = $request->input('batch_id');

        // 1. Idempotency check: prevent duplicate execution of the exact same payload
        $existingLog = DataIngestionLog::where('payload_hash', $hash)->first();
        if ($existingLog) {
            if ($existingLog->status === 'applied' || $existingLog->accepted) {
                return response()->json([
                    'status' => 'ok',
                    'message' => 'Idempotent batch already processed.',
                    'batch_id' => $batchId,
                    'log_id' => $existingLog->id,
                ], 200);
            }

            if ($existingLog->status === 'rejected' || ! $existingLog->accepted) {
                return response()->json([
                    'status' => 'rejected',
                    'message' => 'This batch was previously processed and rejected.',
                    'errors' => $existingLog->error_reasons,
                ], 422);
            }
        }

        $readings = $request->input('readings');
        $uniqueZoneIds = [];

        // 2. Persist readings inside a transaction to ensure all-or-nothing atomicity
        DB::transaction(function () use ($readings, &$uniqueZoneIds) {
            foreach ($readings as $reading) {
                $zoneId = $reading['zone_id'];
                $value = $reading['value'];

                // The pillar key is already constrained to the registry by
                // IngestBatchRequest, so it is safe to build a column from.
                $columnName = Pillars::column($reading['pillar']);

                $zone = Zone::findOrFail($zoneId);
                $zone->update([
                    $columnName => (int) round($value),
                    'last_sync_min' => 0,
                ]);

                if (! in_array($zoneId, $uniqueZoneIds, true)) {
                    $uniqueZoneIds[] = $zoneId;
                }
            }
        });

        // 3. Log success in the append-only logs table
        $log = DataIngestionLog::create([
            'source' => $batchId,
            'payload_hash' => $hash,
            'payload' => $request->all(),
            'accepted' => true,
            'indicators_updated' => count($readings),
            'arrived_at' => now(),
            'received_at' => now(),
            'status' => 'applied',
            'error_reasons' => null,
            'zone_count' => count($uniqueZoneIds),
            'indicator_count' => count($readings),
            'ip' => $request->ip(),
        ]);

        // 4. Dispatch async queue jobs to compute new Vitality Scores per zone
        foreach ($uniqueZoneIds as $zoneId) {
            RecalculateZoneScore::dispatch($zoneId);
        }

        return response()->json([
            'status' => 'ok',
            'message' => 'Batch applied successfully.',
            'batch_id' => $batchId,
            'log_id' => $log->id,
            'zones_updated' => count($uniqueZoneIds),
            'readings_processed' => count($readings),
        ], 200);
    }

    /**
     * Legacy/Single-zone intake endpoint format.
     */
    public function store(Request $request): JsonResponse
    {
        if ($request->has('batch_id') && $request->has('readings')) {
            /** @var IngestBatchRequest $batchRequest */
            $batchRequest = app(IngestBatchRequest::class);

            return $this->ingest($batchRequest);
        }

        $data = $request->validate([
            'source' => ['required', 'string', 'max:96'],
            'zone_id' => ['required', 'string', 'exists:zones,id'],
            'pillars' => ['required', 'array', 'min:1'],
            'received_at' => ['nullable', 'date'],
        ]);

        $known = Pillars::keys();
        $updates = [];
        $ignored = [];
        foreach ($data['pillars'] as $key => $value) {
            if (! in_array($key, $known, true)) {
                $ignored[] = $key;

                continue;
            }
            if ($value !== null && (! is_numeric($value) || $value < 0 || $value > 100)) {
                $ignored[] = $key;

                continue;
            }
            $updates[Pillars::column($key)] = $value === null ? null : (int) $value;
        }

        $hash = hash('sha256', $request->getContent());
        $log = null;
        try {
            $log = DB::transaction(function () use ($data, $updates, $ignored, $request, $hash) {
                if (! empty($updates)) {
                    Zone::where('id', $data['zone_id'])->update($updates);
                }

                return DataIngestionLog::create([
                    'source' => $data['source'],
                    'zone_id' => $data['zone_id'],
                    'payload' => $data,
                    'payload_hash' => $hash,
                    'accepted' => ! empty($updates),
                    'indicators_updated' => count($updates),
                    'error' => ! empty($ignored) ? 'ignored: '.implode(',', $ignored) : null,
                    'ip' => $request->ip(),
                    'received_at' => $data['received_at'] ?? now(),
                    'arrived_at' => now(),
                    'status' => ! empty($updates) ? 'applied' : 'rejected',
                    'error_reasons' => ! empty($ignored) ? ['ignored' => $ignored] : null,
                    'zone_count' => 1,
                    'indicator_count' => count($updates),
                ]);
            });

            if ($log->accepted) {
                RecalculateZoneScore::dispatch($data['zone_id'], true);
            }

            Audit::record(action: 'ingest.'.$data['source'], resource: $log);

            return response()->json([
                'ok' => $log->accepted,
                'log_id' => $log->id,
                'indicators_updated' => $log->indicators_updated,
                'ignored' => $ignored,
            ], $log->accepted ? 202 : 422);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'ok' => false,
                'error' => 'Ingestion failed.',
            ], 500);
        }
    }
}
