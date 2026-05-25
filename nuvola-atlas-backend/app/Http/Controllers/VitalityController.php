<?php

namespace App\Http\Controllers;

use App\Services\ScoreCalculator;
use Illuminate\Support\Facades\Cache;

class VitalityController extends Controller
{
    public function methodology(ScoreCalculator $calculator)
    {
        $data = Cache::remember('vitality_methodology', 86400, fn () => [
            'pillars' => config('methodology'),
            'weights' => $calculator->getWeights(),
        ]);

        return response()->json($data);
    }
}
