<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ModifyTableAssetRequest;
use App\Http\Requests\StoreTableAssetRequest;
use App\Models\User;
use App\Services\TableAttachmentsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class VirtualAssetsController extends Controller
{
    public function index(Request $request, string $table, TableAttachmentsService $assets): JsonResponse
    {
        try {
            return response()->json($assets->listVirtual($table, $this->user($request)));
        } catch (InvalidArgumentException $exception) {
            abort(404, $exception->getMessage());
        }
    }

    public function show(Request $request, string $table, TableAttachmentsService $assets): BinaryFileResponse
    {
        try {
            return $assets->downloadVirtual(
                $table,
                $this->user($request),
                $request->query(),
                $request->boolean('dl'),
            );
        } catch (InvalidArgumentException $exception) {
            abort(404, $exception->getMessage());
        }
    }

    public function store(StoreTableAssetRequest $request, string $table, TableAttachmentsService $assets): JsonResponse
    {
        $user = $this->user($request);
        $file = $request->file('upload');
        if ($file === null) {
            return response()->json(['message' => 'Choose a file to upload.'], 422);
        }

        try {
            $assets->uploadVirtual(
                $table,
                $user,
                $file,
                (string) $request->validated('tlp'),
                (string) ($request->validated('ac') ?? ''),
                $request->boolean('featured'),
            );

            return response()->json($assets->listVirtual($table, $user), 201);
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 500);
        }
    }

    public function update(ModifyTableAssetRequest $request, string $table, TableAttachmentsService $assets): JsonResponse
    {
        try {
            return response()->json($assets->modify($table, null, $this->user($request), $request->validated()));
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 500);
        }
    }

    private function user(Request $request): User
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(401);
        }

        return $user;
    }
}
