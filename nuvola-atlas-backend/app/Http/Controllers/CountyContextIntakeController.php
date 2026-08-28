<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Domain\CountyContext\CountyContextWriteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Throwable;

/**
 * Internal intake for county_context rows. The FastAPI /ingest/wasreb
 * route parses and validates the WASREB long-CSV shape, then POSTs the
 * accepted rows here through the X-Internal-Secret channel.
 */
class CountyContextIntakeController extends Controller
{
    public function __construct(private readonly CountyContextWriteService $writer) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'batch_id' => ['required', 'string'],
            'rows' => ['required', 'array'],
            'rows.*.county' => ['required', 'string'],
            'rows.*.pillar_key' => ['required', 'string'],
            'rows.*.indicator_key' => ['required', 'string'],
            'rows.*.value' => ['nullable', 'numeric'],
            'rows.*.unit' => ['required', 'string'],
            'rows.*.granularity' => ['required', 'string', 'in:county,utility,national'],
            'rows.*.method' => ['required', 'string', 'in:measured,imputed,proxy,gap'],
            'rows.*.source_id' => ['nullable', 'string'],
            'rows.*.vintage' => ['nullable', 'string'],
            'rows.*.retrieved' => ['required', 'date'],
            'rows.*.extraction_confidence' => ['nullable', 'string', 'in:high,medium,low'],
            'rows.*.page_ref' => ['nullable', 'string'],
            'rows.*.notes' => ['nullable', 'string'],
        ]);

        try {
            $result = $this->writer->upsert($data['rows']);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'error' => [
                    'status' => 422,
                    'code' => 'county_context_invalid',
                    'message' => $e->getMessage(),
                ],
            ], 422);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'error' => [
                    'status' => 500,
                    'code' => 'county_context_write_failed',
                    'message' => 'Intake failed.',
                ],
            ], 500);
        }

        return response()->json([
            'success' => [
                'status' => 200,
                'data' => [
                    'batch_id' => $data['batch_id'],
                    'written' => $result['written'],
                    'skipped_retired_pillar' => $result['skipped'],
                ],
                'message' => 'County-context batch applied.',
            ],
        ]);
    }
}
