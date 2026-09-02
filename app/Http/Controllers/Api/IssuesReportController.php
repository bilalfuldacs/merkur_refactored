<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\IssuesReportService;
use Illuminate\Http\JsonResponse;

class IssuesReportController extends Controller
{
    public function show(IssuesReportService $report): JsonResponse
    {
        return response()->json($report->payload());
    }
}
