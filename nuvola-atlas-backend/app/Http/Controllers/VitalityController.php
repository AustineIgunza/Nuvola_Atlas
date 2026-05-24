<?php

namespace App\Http\Controllers;

class VitalityController extends Controller
{
    public function methodology()
    {
        return response()->json([
            'pillars' => config('methodology'),
        ]);
    }
}
