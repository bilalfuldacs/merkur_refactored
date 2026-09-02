<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RoadmapService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoadmapController extends Controller
{
    public function index(Request $request, RoadmapService $roadmap): JsonResponse
    {
        $view = $request->string('view')->toString() === 'games' ? 'games' : 'versions';

        return response()->json($roadmap->payload($view, $request->user()));
    }
}
