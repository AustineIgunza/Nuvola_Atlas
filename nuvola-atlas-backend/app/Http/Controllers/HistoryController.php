<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\HistoryResource;
use App\Models\VitalityHistory;

class HistoryController extends Controller
{
    public function index()
    {
        return HistoryResource::collection(VitalityHistory::orderBy('id')->paginate(20));
    }
}
