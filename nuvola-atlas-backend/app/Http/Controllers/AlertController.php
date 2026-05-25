<?php

namespace App\Http\Controllers;

use App\Http\Resources\AlertResource;
use App\Models\Alert;
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

        return AlertResource::collection($query->paginate(15));
    }

    public function markAllRead()
    {
        Alert::where('read', false)->update(['read' => true]);

        return response()->json(['ok' => true]);
    }
}
