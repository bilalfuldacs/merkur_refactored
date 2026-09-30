<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReleaseInformationSheetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReleaseInformationSheetController extends Controller
{
    public function show(int $release, Request $request, ReleaseInformationSheetService $sheets): JsonResponse
    {
        $user = $request->user();
        if ($user === null) {
            abort(401);
        }

        return response()->json($sheets->payload($release, $user));
    }
}
