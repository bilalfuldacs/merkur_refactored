<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TableHistoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminTableHistoryController extends Controller
{
    public function __construct(private TableHistoryService $history) {}

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isSuperuser(), 403, 'Superuser access required.');

        return response()->json($this->history->catalogStatus());
    }
}
