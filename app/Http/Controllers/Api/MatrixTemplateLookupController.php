<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MatrixTemplate;
use App\Models\User;
use App\Services\TableViewSchemaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class MatrixTemplateLookupController extends Controller
{
    public function show(
        Request $request,
        string $table,
        string $column,
        TableViewSchemaService $schema,
    ): JsonResponse {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(401);
        }

        try {
            $schema->payload($table, $user);
        } catch (InvalidArgumentException) {
            abort(404, 'Unknown table.');
        }

        if (! preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $column)) {
            abort(404, 'Unknown column.');
        }

        $template = MatrixTemplate::query()
            ->where('table', $table)
            ->where('column', $column)
            ->where('active', true)
            ->value('template');

        if (! is_array($template)) {
            $template = [];
        }

        $rowHeaders = $this->stringList($template['row_headers'] ?? null);
        $colHeaders = $this->stringList($template['col_headers'] ?? null);

        if ($rowHeaders === [] || $colHeaders === []) {
            $rowHeaders = ['Row #1', 'Row #2', 'Row #3'];
            $colHeaders = ['Column #1', 'Column #2', 'Column #3'];
        }

        $rows = count($rowHeaders);
        $cols = count($colHeaders);
        $data = [];
        $source = is_array($template['data'] ?? null) ? $template['data'] : [];
        for ($r = 0; $r < $rows; $r++) {
            $row = [];
            $sourceRow = is_array($source[$r] ?? null) ? $source[$r] : [];
            for ($c = 0; $c < $cols; $c++) {
                $cell = $sourceRow[$c] ?? '';
                $row[] = is_scalar($cell) || $cell === null ? (string) ($cell ?? '') : '';
            }
            $data[] = $row;
        }

        return response()->json([
            'row_headers' => $rowHeaders,
            'col_headers' => $colHeaders,
            'data' => $data,
        ]);
    }

    /**
     * @return list<string>
     */
    private function stringList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $out = [];
        foreach ($value as $item) {
            if (is_scalar($item) || $item === null) {
                $out[] = (string) ($item ?? '');
            }
        }

        return $out;
    }
}
