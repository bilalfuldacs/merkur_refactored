<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FocusGroupsReportService;
use Illuminate\Http\JsonResponse;

class FocusGroupsReportController extends Controller
{
    public function show(FocusGroupsReportService $report): JsonResponse
    {
        return response()->json($report->payload());
    }
}
