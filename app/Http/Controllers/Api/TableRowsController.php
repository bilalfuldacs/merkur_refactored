<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TableExportService;
use App\Services\TableHistoryService;
use App\Services\TableRowsService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

class TableRowsController extends Controller
{
    public function index(Request $request, string $table, TableRowsService $rows): JsonResponse
    {
        $user = $this->user($request);

        try {
            return response()->json($rows->paginate($table, $user, $request));
        } catch (InvalidArgumentException) {
            abort(404, 'Unknown table.');
        }
    }

    public function export(Request $request, string $table, TableRowsService $rows, TableExportService $export): Response
    {
        $user = $this->user($request);
        $format = strtolower((string) $request->query('format', 'csv'));
        if (! in_array($format, ['csv', 'xlsx', 'pdf', 'html'], true)) {
            abort(422, 'Unknown export format.');
        }

        try {
            return $export->download(
                $rows->exportDataset($table, $user, $request),
                $format,
                $request->boolean('inline'),
            );
        } catch (InvalidArgumentException) {
            abort(404, 'Unknown table.');
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'The PDF could not be generated. Hide some columns and try again.',
            ], 500);
        }
    }

    public function lookups(Request $request, string $table, TableRowsService $rows): JsonResponse
    {
       $user = $this->user($request);

        try {
            return response()->json(['lookups' => $rows->lookups($table, $user)]);
        } catch (InvalidArgumentException) {
            abort(404, 'Unknown table.');
        }
    }

    public function history(Request $request, string $table, int $id, TableHistoryService $history): JsonResponse
    {
        $user = $this->user($request);

        try {
            return response()->json($history->forRecord($table, $user, $id));
        } catch (InvalidArgumentException $exception) {
            abort(404, $exception->getMessage());
        }
    }

    public function show(Request $request, string $table, int $id, TableRowsService $rows): JsonResponse
    {
        $user = $this->user($request);

        try {
            return response()->json(['data' => $rows->find($table, $user, $id)]);
        } catch (InvalidArgumentException $exception) {
            abort(404, $exception->getMessage());
        }
    }

    public function store(Request $request, string $table, TableRowsService $rows): JsonResponse
    {
        $user = $this->user($request);

        try {
            return response()->json(['data' => $rows->store($table, $user, $request)], 201);
        } catch (InvalidArgumentException $exception) {
            abort(404, $exception->getMessage());
        } catch (HttpException $exception) {
            throw $exception;
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 409);
        } catch (QueryException) {
            return response()->json([
                'message' => 'This record could not be saved. Check the values and try again.',
            ], 422);
        }
    }

    public function update(Request $request, string $table, int $id, TableRowsService $rows): JsonResponse
    {
        $user = $this->user($request);

        try {
            return response()->json(['data' => $rows->update($table, $user, $id, $request)]);
        } catch (InvalidArgumentException $exception) {
            abort(404, $exception->getMessage());
        } catch (HttpException $exception) {
            throw $exception;
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 409);
        } catch (QueryException) {
            return response()->json([
                'message' => 'This record could not be saved. Check the values and try again.',
            ], 422);
        }
    }

    public function destroy(Request $request, string $table, int $id, TableRowsService $rows): JsonResponse
    {
        $user = $this->user($request);

        try {
            $rows->destroy($table, $user, $id);

            return response()->json(status: 204);
        } catch (InvalidArgumentException $exception) {
            abort(404, $exception->getMessage());
        } catch (HttpException $exception) {
            throw $exception;
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 409);
        } catch (QueryException) {
            return response()->json([
                'message' => 'Cannot delete this record because other records still reference it.',
            ], 409);
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
