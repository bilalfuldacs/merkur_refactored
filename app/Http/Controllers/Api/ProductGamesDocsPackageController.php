<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ProductGamesDocsPackageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductGamesDocsPackageController extends Controller
{
    public function show(int $version, Request $request, ProductGamesDocsPackageService $docs): JsonResponse
    {
        $user = $request->user();
        if ($user === null) {
            abort(401);
        }

        return response()->json($docs->payload($version, $user));
    }

    public function download(int $version, Request $request, ProductGamesDocsPackageService $docs): StreamedResponse|JsonResponse
    {
        $user = $request->user();
        if ($user === null) {
            abort(401);
        }

        $validated = $request->validate([
            'files' => ['required', 'array', 'min:1'],
            'files.*.game_ID' => ['required', 'integer', 'min:1'],
            'files.*.tlp' => ['required', 'string', 'in:amber,green,clear'],
            'files.*.filename' => ['required', 'string', 'max:500'],
        ]);

        try {
            return $docs->downloadZip($version, $user, $validated['files']);
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }
}
