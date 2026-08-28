<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Domain\Scoring\ScoreCalculator;
use App\Models\Zone;
use App\Services\Export\ZoneReportExporter;
use App\Support\DataProvenance;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ZoneExportController extends Controller
{
    public function show(string $id, Request $request, ZoneReportExporter $exporter, ScoreCalculator $calc)
    {
        $request->validate([
            'format' => 'nullable|in:txt,pdf,docx',
        ]);
        $format = $request->input('format', 'pdf');

        $zone = Zone::findOrFail($id);

        // The fixture gate — R2 §P7.3. A zone whose score traces to seeded
        // fixtures never leaves the system through an export. Even an admin
        // does not get a signed PDF of a demo number — the risk (a leaked
        // "official" report for Kibra with an invented score) is not one
        // that survives a signature.
        $provenance = $calc->dataProvenance($zone);
        if (! DataProvenance::isPublishable($provenance)) {
            throw new HttpException(
                403,
                "This zone's score is currently {$provenance} data and cannot be exported. ".
                'Only zones whose contributing pillars trace to a real ingested feed are exportable. '.
                'See NAVUUNA_PROMPTS_ROUND2.md §P7.3.'
            );
        }

        $out = $exporter->export($zone, $format);

        return response($out['body'], 200, [
            'Content-Type' => $out['mime'],
            'Content-Disposition' => 'attachment; filename="'.$out['filename'].'"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
