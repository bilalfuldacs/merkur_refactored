<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HomeDashboardService;
use Illuminate\Http\JsonResponse;

class HomeDashboardController extends Controller
{
    public function index(HomeDashboardService $dashboard): JsonResponse
    {
        return response()->json($dashboard->payload());
    }
}
