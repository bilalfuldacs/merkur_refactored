<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TasksService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TasksController extends Controller
{
    public function index(Request $request, TasksService $tasks): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(401);
        }

        $people = is_string($request->query('p')) ? $request->query('p') : 'm';
        $time = is_string($request->query('t')) ? $request->query('t') : 'a';

        return response()->json($tasks->payload($user, $people, $time));
    }
}
