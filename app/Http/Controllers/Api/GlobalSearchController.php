<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\GlobalSearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    public function index(Request $request, GlobalSearchService $search): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(401);
        }

        $query = is_string($request->query('q')) ? $request->query('q') : '';
        $limit = $request->integer('limit', 100);
        $limit = max(1, min($limit, 100));

        return response()->json($search->payload($user, $query, $limit));
    }
}
