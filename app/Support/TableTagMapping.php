<?php

namespace App\Support;

use Illuminate\Support\Facades\Schema;
use Throwable;

final class TableTagMapping
{
    /**
     * Many-to-many column comment: &mapping_table
     * Mapping tables use ID, mod_date, mod_by, then the master FK and tag FK.
     *
     * @return array{
     *     mappingTable: string,
     *     masterColumn: string,
     *     tagColumn: string,
     *     tagsTable: string,
     *     tagNameColumn: string
     * }|null
     */
    public static function fromComment(string $comment): ?array
    {
        if (preg_match('/\A&([-_a-zA-Z0-9]{1,50})/', ltrim($comment), $matches) !== 1) {
            return null;
        }

        $mappingTable = self::resolveTableName($matches[1]);
        if ($mappingTable === null) {
            return null;
        }

        try {
            $mapCols = Schema::getColumns($mappingTable);
        } catch (Throwable) {
            return null;
        }

        if (count($mapCols) < 5) {
            return null;
        }

        $tagComment = (string) ($mapCols[4]['comment'] ?? '');
        if (preg_match('/\B@(?:@!?)?([-_a-zA-Z0-9]{1,30})\.([-_a-zA-Z0-9]{1,30})/', $tagComment, $tagMatches) !== 1) {
            return null;
        }

        $tagsTable = self::resolveTableName($tagMatches[1]);
        if ($tagsTable === null) {
            return null;
        }

        $tagNameColumn = $tagMatches[2];
        if (! Schema::hasColumn($tagsTable, $tagNameColumn)) {
            $tagNameColumn = Schema::hasColumn($tagsTable, 'name') ? 'name' : 'ID';
        }

        $masterColumn = (string) ($mapCols[3]['name'] ?? '');
        $tagColumn = (string) ($mapCols[4]['name'] ?? '');
        if ($masterColumn === '' || $tagColumn === '') {
            return null;
        }

        return [
            'mappingTable' => $mappingTable,
            'masterColumn' => $masterColumn,
            'tagColumn' => $tagColumn,
            'tagsTable' => $tagsTable,
            'tagNameColumn' => $tagNameColumn,
        ];
    }

    public static function resolveTableName(string $name): ?string
    {
        if (! preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $name)) {
            return null;
        }

        $aliases = [
            'users' => 'dynamic__users',
            'statuses' => 'config__statuses',
        ];
        $candidate = $aliases[$name] ?? $name;

        if (Schema::hasTable($candidate)) {
            return $candidate;
        }

        $lower = strtolower($candidate);
        if ($lower !== $candidate && Schema::hasTable($lower)) {
            return $lower;
        }

        if (str_ends_with($candidate, '_PVIEW')) {
            $base = substr($candidate, 0, -6);
            if ($base !== '' && Schema::hasTable($base)) {
                return $base;
            }
        }

        return null;
    }
}
