<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PeopleMarketsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PeopleMarketsController extends Controller
{
    public function index(Request $request, PeopleMarketsService $panorama): JsonResponse
    {
        return response()->json($panorama->payload($request->user()));
    }
}
