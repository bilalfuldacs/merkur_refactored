<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TableAttachmentsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAttachmentsTrashController extends Controller
{
    public function __construct(private TableAttachmentsService $attachments) {}

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isSuperuser(), 403, 'Superuser access required.');

        return response()->json([
            'items' => $this->attachments->listTrashed(),
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isSuperuser(), 403, 'Superuser access required.');

        $validated = $request->validate([
            'paths' => ['sometimes', 'array'],
            'paths.*' => ['string', 'max:2048'],
            'all' => ['sometimes', 'boolean'],
        ]);

        $all = (bool) ($validated['all'] ?? false);
        $paths = $all ? null : ($validated['paths'] ?? []);

        if (! $all && ($paths === [] || $paths === null)) {
            return response()->json(['message' => 'Select attachments to purge, or set all=true.'], 422);
        }

        $result = $this->attachments->purgeTrashed($paths);

        return response()->json($result);
    }
}
