<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Domain\Feeds\FeedStatusService;
use Illuminate\Http\JsonResponse;

class AdminFeedsController extends Controller
{
    public function __construct(private FeedStatusService $service) {}

    public function index(): JsonResponse
    {
        return response()->json($this->service->matrix());
    }
}
