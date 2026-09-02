<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\MarketReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class MarketReportController extends Controller
{
    public function show(Request $request, MarketReportService $report): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(401);
        }

        $jurisdictionId = (int) $request->query('j');
        if ($jurisdictionId <= 0) {
            abort(404, 'Unknown market.');
        }

        try {
            return response()->json($report->payload($user, $jurisdictionId));
        } catch (InvalidArgumentException $exception) {
            abort(404, $exception->getMessage());
        }
    }
}
