<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

final class TableViewQuery
{
    public const PAGE_SIZE_OPTIONS = [10, 15, 20, 25, 50, 100, 250, 500];

    public const DEFAULT_PAGE_SIZE = 25;

    public const MAX_PAGE_SIZE = 500;

    public static function perPage(Request $request, int $default = self::DEFAULT_PAGE_SIZE): int
    {
        return max(1, min($request->integer('per_page', $default), self::MAX_PAGE_SIZE));
    }

    /**
     * @param  Builder<*>  $query
     * @param  array<string, mixed>  $schema
     */
    public static function applySorts(Builder $query, Request $request, array $schema): void
    {
        $source = (string) ($schema['source'] ?? $schema['table'] ?? '');
        $defaults = is_array($schema['defaults'] ?? null) ? $schema['defaults'] : [];
        $joins = [];

        self::applySort(
            $query,
            $source,
            $schema,
            (string) $request->query('sort_by', (string) ($defaults['sort_by'] ?? 'ID')),
            (string) $request->query('sort_dir', (string) ($defaults['sort_dir'] ?? 'DESC')),
            $joins,
            secondary: false,
        );

        self::applySort(
            $query,
            $source,
            $schema,
            (string) $request->query('sort_by2', (string) ($defaults['sort_by2'] ?? '')),
            (string) $request->query('sort_dir2', (string) ($defaults['sort_dir2'] ?? 'ASC')),
            $joins,
            secondary: true,
        );
    }

    /**
     * @param  Builder<*>  $query
     * @param  array<string, mixed>  $schema
     * @param  array<string, true>  $joined
     */
    private static function applySort(
        Builder $query,
        string $source,
        array $schema,
        string $column,
        string $direction,
        array &$joined,
        bool $secondary,
    ): void {
        $spec = self::columnSpec($schema, $column);

        if ($spec === null) {
            if (! $secondary) {
                $fallback = (string) (($schema['defaults']['sort_by'] ?? null) ?: 'ID');
                $query->orderByDesc($source.'.'.$fallback);
            }

            return;
        }

        $dir = strtoupper($direction) === 'ASC' ? 'asc' : 'desc';
        $join = is_array($spec['sort_join'] ?? null) ? $spec['sort_join'] : null;

        if ($join !== null) {
            $alias = (string) $join['alias'];
            if (! isset($joined[$alias])) {
                $query->leftJoin($join['table'].' as '.$alias, $alias.'.ID', '=', $source.'.'.$spec['key']);
                $joined[$alias] = true;
            }
            $query->orderBy($alias.'.'.$join['column'], $dir);

            return;
        }

        $query->orderBy($source.'.'.$spec['key'], $dir);
    }

    /**
     * @param  array<string, mixed>  $schema
     * @return array<string, mixed>|null
     */
    private static function columnSpec(array $schema, string $key): ?array
    {
        if ($key === '') {
            return null;
        }

        foreach ($schema['columns'] ?? [] as $column) {
            if (is_array($column) && ($column['key'] ?? null) === $key) {
                return $column;
            }
        }

        return null;
    }
}
