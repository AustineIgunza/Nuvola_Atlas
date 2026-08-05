<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Jobs\RecalculateZoneScore;
use App\Models\DataIngestionLog;
use App\Models\Zone;
use App\Services\ScoreCalculator;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Phase B — FastAPI → Laravel data intake.
 *
 * Payload envelope (from the ingestion service):
 * {
 *   "source": "fastapi.daystar",
 *   "zone_id": "westlands",
 *   "indicators": { "healthcare_access": 82, "digital_connectivity": null },
 *   "received_at": "2026-08-05T10:00:00Z"
 * }
 *
 * Only known indicator slugs are accepted; anything else is dropped
 * silently and reported in the response body so the caller can log the
 * mismatch. Every request is logged into `data_ingestion_logs`
 * regardless of accept/reject state.
 */
class IngestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'source' => ['required', 'string', 'max:96'],
            'zone_id' => ['required', 'string', 'exists:zones,id'],
            'indicators' => ['required', 'array', 'min:1'],
            'received_at' => ['nullable', 'date'],
        ]);

        $known = collect(ScoreCalculator::pillars())->flatten()->all();
        $updates = [];
        $ignored = [];
        foreach ($data['indicators'] as $slug => $value) {
            if (! in_array($slug, $known, true)) {
                $ignored[] = $slug;
                continue;
            }
            if ($value !== null && (! is_numeric($value) || $value < 0 || $value > 100)) {
                $ignored[] = $slug;
                continue;
            }
            $updates['indicator_'.$slug] = $value === null ? null : (int) $value;
        }

        $log = null;
        try {
            $log = DB::transaction(function () use ($data, $updates, $ignored, $request) {
                $entry = DataIngestionLog::create([
                    'source' => $data['source'],
                    'zone_id' => $data['zone_id'],
                    'payload' => $data,
                    'accepted' => false,
                    'indicators_updated' => 0,
                    'ip' => $request->ip(),
                    'received_at' => $data['received_at'] ?? now(),
                ]);

                if (! empty($updates)) {
                    Zone::where('id', $data['zone_id'])->update($updates);
                    $entry->accepted = true;
                    $entry->indicators_updated = count($updates);
                    if (! empty($ignored)) {
                        $entry->error = 'ignored: '.implode(',', $ignored);
                    }
                    $entry->save();
                }

                return $entry;
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
            if ($log) {
                $log->error = substr($e->getMessage(), 0, 500);
                $log->accepted = false;
                $log->save();
            }
            report($e);
            return response()->json([
                'ok' => false,
                'error' => 'Ingestion failed.',
            ], 500);
        }
    }
}
