<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Domain\Forecast\ZoneScoreForecaster;
use App\Models\Zone;
use Illuminate\Http\Request;

class ZoneForecastController extends Controller
{
    public function show(string $id, Request $request, ZoneScoreForecaster $forecaster)
    {
        $request->validate(['horizon' => 'integer|min:1|max:30']);
        $horizon = (int) $request->input('horizon', 14);

        $zone = Zone::findOrFail($id);
        $result = $forecaster->forecast($zone->id, $horizon);

        return response()->json($result);
    }
}
