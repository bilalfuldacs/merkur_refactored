<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TablesCatalogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TablesCatalogController extends Controller
{
    public function index(Request $request, TablesCatalogService $catalog): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(401);
        }

        return response()->json($catalog->payload($user));
    }
}
