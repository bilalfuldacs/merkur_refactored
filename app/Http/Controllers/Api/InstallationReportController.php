<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\InstallationReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstallationReportController extends Controller
{
    public function show(Request $request, InstallationReportService $report): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(401);
        }

        $version = $request->query('v');
        $versionId = is_numeric($version) ? (int) $version : null;

        return response()->json($report->payload($user, $versionId));
    }
}
