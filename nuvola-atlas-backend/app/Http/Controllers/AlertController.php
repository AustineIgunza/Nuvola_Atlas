<?php

namespace App\Http\Controllers;

use App\Http\Resources\AlertResource;
use App\Models\Alert;
use App\Support\Audit;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    public function index(Request $request)
    {
        $query = Alert::latest();

        if ($request->has('severity')) {
            $query->where('severity', $request->input('severity'));
        }

        if ($request->has('read')) {
            $query->where('read', filter_var($request->input('read'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('zone_id')) {
            $query->where('zone_id', $request->input('zone_id'));
        }

        return AlertResource::collection($query->cursorPaginate(15));
    }

    public function markAllRead()
    {
        $affected = Alert::where('read', false)->update(['read' => true]);

        Audit::record(action: 'alert.bulk_read', after: ['affected' => $affected]);

        return response()->json(['ok' => true]);
    }
}
