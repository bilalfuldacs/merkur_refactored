<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportsCatalogService;
use Illuminate\Http\JsonResponse;

class ReportsCatalogController extends Controller
{
    public function index(ReportsCatalogService $catalog): JsonResponse
    {
        return response()->json($catalog->payload());
    }
}
