<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MarsApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class MarsApiController extends Controller
{
    public function __construct(private MarsApiService $mars) {}

    public function index(): JsonResponse
    {
        return response()->json($this->mars->index());
    }

    public function businessPartners(Request $request): JsonResponse
    {
        return $this->respond(fn () => $this->mars->businessPartners($request));
    }

    public function venues(Request $request): JsonResponse
    {
        return $this->respond(fn () => $this->mars->venues($request));
    }

    public function versions(Request $request): JsonResponse
    {
        return $this->respond(fn () => $this->mars->versions($request));
    }

    /**
     * @param  callable(): array<string, mixed>  $loader
     */
    private function respond(callable $loader): JsonResponse
    {
        try {
            $payload = $loader();
        } catch (InvalidArgumentException $e) {
            $status = $e->getMessage() === 'Not found' ? 404 : 400;

            return response()->json(['error' => $e->getMessage()], $status);
        }

        return response()->json($payload);
    }
}
