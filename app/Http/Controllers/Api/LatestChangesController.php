<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LatestChangesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LatestChangesController extends Controller
{
    public function index(Request $request, LatestChangesService $changes): JsonResponse
    {
        return response()->json(
            $changes->payload($request->user(), $request->integer('count', 5)),
        );
    }
}
