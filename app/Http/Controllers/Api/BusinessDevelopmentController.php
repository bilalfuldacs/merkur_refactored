<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\BusinessDevelopmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class BusinessDevelopmentController extends Controller
{
    public function show(Request $request, BusinessDevelopmentService $bd): JsonResponse
    {
        return $this->run(fn () => $bd->payload($this->user($request)));
    }

    public function createMarket(Request $request, BusinessDevelopmentService $bd): JsonResponse
    {
        return $this->run(fn () => $bd->createMarket($this->user($request), $request->all()));
    }

    public function updateMarket(Request $request, BusinessDevelopmentService $bd): JsonResponse
    {
        return $this->run(fn () => $bd->updateMarket($this->user($request), $request->all()));
    }

    public function createSegment(Request $request, BusinessDevelopmentService $bd): JsonResponse
    {
        return $this->run(fn () => $bd->createSegment($this->user($request), $request->all()));
    }

    public function updateSegment(Request $request, BusinessDevelopmentService $bd): JsonResponse
    {
        return $this->run(fn () => $bd->updateSegment($this->user($request), $request->all()));
    }

    private function user(Request $request): User
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('role');

        return $user;
    }

    /**
     * @param  callable(): array<string, mixed>  $callback
     */
    private function run(callable $callback): JsonResponse
    {
        try {
            return response()->json($callback());
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
