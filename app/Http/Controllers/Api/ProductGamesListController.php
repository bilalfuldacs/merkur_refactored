<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ProductGamesListService;
use Illuminate\Http\JsonResponse;

class ProductGamesListController extends Controller
{
    public function show(int $version, ProductGamesListService $games): JsonResponse
    {
        return response()->json($games->payload($version));
    }
}
