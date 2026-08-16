<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Zone;
use App\Services\Export\ZoneReportExporter;
use Illuminate\Http\Request;

class ZoneExportController extends Controller
{
    public function show(string $id, Request $request, ZoneReportExporter $exporter)
    {
        $request->validate([
            'format' => 'nullable|in:txt,pdf,docx',
        ]);
        $format = $request->input('format', 'pdf');

        $zone = Zone::findOrFail($id);
        $out = $exporter->export($zone, $format);

        return response($out['body'], 200, [
            'Content-Type' => $out['mime'],
            'Content-Disposition' => 'attachment; filename="'.$out['filename'].'"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
