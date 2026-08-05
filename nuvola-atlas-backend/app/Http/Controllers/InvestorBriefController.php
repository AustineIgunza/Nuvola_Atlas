<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\Export\FirmBriefExporter;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Phase F — /investor/brief.
 *
 * Streams an LP-style PDF across the firm's watchlist. FirmBriefExporter
 * owns the render; this controller only handles auth + audit + delivery.
 */
class InvestorBriefController extends Controller
{
    public function __construct(private FirmBriefExporter $exporter) {}

    public function download(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $firm = $user->primaryFirm;

        if (! $firm) {
            abort(403, 'This route requires an assigned firm.');
        }

        $result = $this->exporter->export($firm);

        Audit::record(action: 'investor.brief.download', resource: $firm);

        return response($result['body'], 200, [
            'Content-Type' => $result['mime'],
            'Content-Disposition' => 'attachment; filename="'.$result['filename'].'"',
            'Cache-Control' => 'no-store',
        ]);
    }
}
