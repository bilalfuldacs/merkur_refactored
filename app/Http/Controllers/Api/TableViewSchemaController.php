<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TableViewSchemaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class TableViewSchemaController extends Controller
{
    public function show(Request $request, string $table, TableViewSchemaService $schema): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(401);
        }

        try {
            return response()->json($schema->payload($table, $user));
        } catch (InvalidArgumentException) {
            abort(404, 'Unknown table.');
        }
    }
}
