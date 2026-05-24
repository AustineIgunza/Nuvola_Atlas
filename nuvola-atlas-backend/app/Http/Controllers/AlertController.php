<?php

namespace App\Http\Controllers;

use App\Http\Resources\AlertResource;
use App\Models\Alert;

class AlertController extends Controller
{
    public function index()
    {
        return AlertResource::collection(Alert::latest()->get());
    }

    public function markAllRead()
    {
        Alert::where('read', false)->update(['read' => true]);

        return response()->json(['ok' => true]);
    }
}
