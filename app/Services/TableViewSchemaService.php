<?php

namespace App\Services;

use App\Models\ConfigTable;
use App\Models\User;
use App\Support\NiceFieldName;
use App\Support\TableResourceMap;
use App\Support\TableViewQuery;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

class TableViewSchemaService
{
    public const PRIMARY_COLUMN_COUNT = 10;

    private const TABLE_ALIASES = [
        'users' => 'dynamic__users',
        'statuses' => 'config__statuses',
    ];

    /**
     * @return array<string, mixed>
     */
    public function payload(string $table, User $user): array
    {
        if (! preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $table)) {
            throw new InvalidArgumentException('Unknown table.');
        }

        $config = ConfigTable::query()->where('table', $table)->first();
        if ($config === null || $config->title === null) {
            throw new InvalidArgumentException('Unknown table.');
        }

        $tableName = $this->resolveTableName((string) $config->table);
        $viewName = is_string($config->view) && $config->view !== ''
            ? $this->resolveTableName($config->view)
            : null;

        if ($tableName === null) {
            throw new InvalidArgumentException('Unknown table.');
        }

        $columnSource = $viewName ?? $tableName;
        $isSystem = (bool) $config->system_table;
        $canEdit = $isSystem ? $user->isSuperuser() : $user->canCreateUpdateItems();
        $columns = $this->columns($columnSource, $config, $user);
        $columnKeys = array_column($columns, 'key');
        [$sortBy, $sortDir, $sortBy2, $sortDir2] = $this->defaultOrder((string) $config->default_view_order, $columnKeys);

        $visible = array_values(array_filter(
            array_map(trim(...), explode(',', (string) $config->default_view_columns)),
            fn (string $key): bool => in_array($key, $columnKeys, true),
        ));

        if ($visible === []) {
            $visible = array_slice($columnKeys, 0, 5);
        }

        $binding = TableResourceMap::forSource($tableName);
        $incrementing = true;
        if ($binding !== null) {
            $model = new $binding->model;
            $incrementing = $model->getIncrementing();
        }

        return [
            'table' => $config->table,
            'source' => $tableName,
            'title' => $config->title ?: $config->item_name ?: $config->table,
            'item_name' => $config->item_name,
            'default_view_name' => $config->default_view_name ?: 'Default',
            'link_column' => $config->link_column,
            'has_history' => (bool) $config->has_history || Schema::hasTable($tableName.'_history'),
            'icon' => $config->icon,
            'color' => $config->color ?: '#E83181',
            'infobox' => (string) $config->infobox,
            'can_edit' => $canEdit,
            'can_delete' => $canEdit && $user->canDeleteItems(),
            'edit_extras' => $config->edit_extras,
            'has_backlink' => $config->has_backlink ?: 'none',
            'incrementing' => $incrementing,
            'collapse_item' => $config->collapse_item,
            'primary_column_count' => self::PRIMARY_COLUMN_COUNT,
            'page_size_options' => TableViewQuery::PAGE_SIZE_OPTIONS,
            'defaults' => [
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
                'sort_by2' => $sortBy2,
                'sort_dir2' => $sortDir2,
                'per_page' => TableViewQuery::DEFAULT_PAGE_SIZE,
                'width_mode' => 's',
                'visible_columns' => $visible,
            ],
            'columns' => $columns,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function columns(string $source, ConfigTable $config, User $user): array
    {
        $itemName = (string) $config->item_name;
        $linkColumn = $config->link_column;
        $columns = [];
        $usedAliases = [];

        foreach (Schema::getColumns($source) as $column) {
            $key = (string) $column['name'];
            $comment = (string) ($column['comment'] ?? '');
            $flags = $this->flags($comment);

            if ($key === 'mod_date' || $key === 'mod_by' || in_array('hidden', $flags, true)) {
                continue;
            }

            if (in_array('tlp_red', $flags, true) && ! $user->canUseTlpRed()) {
                continue;
            }

            $foreign = $this->foreignKey($comment);
            $kind = $this->kind($key, (string) ($column['type_name'] ?? ''), $flags, $foreign !== null, $comment);
            $sortJoin = null;
            $relatedTable = $foreign !== null ? $this->resolveTableName($foreign['table']) : null;
            if ($foreign !== null && $relatedTable !== null) {
                $alias = $this->joinAlias($key, $usedAliases);
                $usedAliases[] = $alias;
                $sortJoin = [
                    'table' => $relatedTable,
                    'column' => $this->joinColumn($foreign, $relatedTable),
                    'alias' => $alias,
                ];
            }

            $help = null;
            if (preg_match('/\[(.*?)\]/', $comment, $helpMatch) === 1) {
                $help = trim($helpMatch[1]);
            }

            $placeholder = null;
            if (preg_match('/\((.*?)\)/', $comment, $placeholderMatch) === 1) {
                $placeholder = trim($placeholderMatch[1]);
            }

            $columns[] = [
                'key' => $key,
                'label' => NiceFieldName::label($key, $itemName),
                'kind' => $kind,
                'link' => $key === $linkColumn,
                'primary' => $key === 'ID',
                'relation_key' => $foreign !== null ? $this->relationKey($key) : null,
                'related_table' => $relatedTable,
                'related_display' => $foreign !== null ? $foreign['column'] : null,
                'open_related' => $foreign !== null && str_starts_with(ltrim($comment), '@@'),
                'sort_join' => $sortJoin,
                'nullable' => (bool) ($column['nullable'] ?? false),
                'disabled' => in_array('disabled', $flags, true),
                'multiline' => in_array(strtolower((string) ($column['type_name'] ?? '')), ['text', 'longtext', 'mediumtext', 'tinytext'], true),
                'max_length' => isset($column['length']) && is_numeric($column['length']) ? (int) $column['length'] : null,
                'enum_options' => $this->enumOptions((string) ($column['type'] ?? '')),
                'help' => $help !== '' ? $help : null,
                'placeholder' => $placeholder !== '' ? $placeholder : null,
            ];
        }

        return $columns;
    }

    /**
     * @return list<string>
     */
    private function flags(string $comment): array
    {
        $clean = trim((string) preg_replace('/\[.*?\]|\{.*?\}|\(.*?\)/', '', $comment));
        if ($clean === '') {
            return [];
        }

        return array_values(array_filter(preg_split('/\s+/', $clean) ?: []));
    }

    /**
     * @return array{table: string, column: string, sort_column: string|null}|null
     */
    private function foreignKey(string $comment): ?array
    {
        if (preg_match('/^@(@!?)?([A-Za-z_][A-Za-z0-9_]{0,39})\.([A-Za-z_][A-Za-z0-9_]{0,39})(?:[<>]([A-Za-z_][A-Za-z0-9_]{0,39}))?/', $comment, $matches) !== 1) {
            return null;
        }

        return [
            'table' => $matches[2],
            'column' => $matches[3],
            'sort_column' => $matches[4] ?? null,
        ];
    }

    /**
     * @param  array{table: string, column: string, sort_column: string|null}  $foreign
     */
    private function joinColumn(array $foreign, string $relatedTable): string
    {
        $preferred = $foreign['sort_column'];
        if (is_string($preferred) && $preferred !== '' && Schema::hasColumn($relatedTable, $preferred)) {
            return $preferred;
        }

        if (Schema::hasColumn($relatedTable, $foreign['column'])) {
            return $foreign['column'];
        }

        return Schema::hasColumn($relatedTable, 'name') ? 'name' : 'ID';
    }

    private function resolveTableName(string $name): ?string
    {
        if (! preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $name)) {
            return null;
        }

        $candidate = self::TABLE_ALIASES[$name] ?? $name;

        if (Schema::hasTable($candidate)) {
            return $candidate;
        }

        $lower = strtolower($candidate);
        if ($lower !== $candidate && Schema::hasTable($lower)) {
            return $lower;
        }

        return null;
    }

    /**
     * @param  list<string>  $usedAliases
     */
    private function joinAlias(string $key, array $usedAliases): string
    {
        $safe = preg_replace('/[^A-Za-z0-9_]+/', '_', $key) ?: 'col';
        $alias = 'sort_'.$safe;
        $suffix = 2;
        while (in_array($alias, $usedAliases, true)) {
            $alias = 'sort_'.$safe.'_'.$suffix;
            $suffix++;
        }

        return $alias;
    }

    private function relationKey(string $column): string
    {
        return match ($column) {
            '3rd_party' => 'third_party',
            'pry_design_target_mkt' => 'primary_design_target_market',
            'variant_of_concept_ID' => 'variant_of',
            'pm_owner_ID' => 'pm_owner',
            default => str_ends_with($column, '_ID') ? substr($column, 0, -3) : $column,
        };
    }

    /**
     * @param  list<string>  $flags
     */
    private function kind(string $key, string $typeName, array $flags, bool $isForeign, string $comment): string
    {
        if ($key === 'ID') {
            return 'id';
        }

        if ($isForeign) {
            return 'relation';
        }

        if (in_array('boolean', $flags, true)) {
            return 'boolean';
        }

        if (in_array('color', $flags, true)) {
            return 'color';
        }

        if (in_array('traffic-light', $flags, true)) {
            return 'traffic_light';
        }

        if (in_array('status-indicator', $flags, true)) {
            return 'status_indicator';
        }

        if (in_array('link', $flags, true)) {
            return 'url';
        }

        if ($typeName === 'enum') {
            return 'enum';
        }

        if ($typeName === 'json' || str_contains(strtolower($comment), 'json') || in_array('matrix', $flags, true)) {
            return 'json';
        }

        return 'text';
    }

    /**
     * @return list<string>
     */
    private function enumOptions(string $type): array
    {
        if (preg_match_all("/'((?:\\\\'|[^'])*)'/", $type, $matches) < 1) {
            return [];
        }

        return array_values(array_map(
            static fn (string $value): string => str_replace("\\'", "'", $value),
            $matches[1],
        ));
    }

    /**
     * @param  list<string>  $columnKeys
     * @return array{0: string, 1: string, 2: string, 3: string}
     */
    private function defaultOrder(string $order, array $columnKeys): array
    {
        $sortBy = in_array('ID', $columnKeys, true) ? 'ID' : ($columnKeys[0] ?? 'ID');
        $sortDir = 'DESC';
        $sortBy2 = '';
        $sortDir2 = 'ASC';

        if (preg_match('/^(<|>)(\w+)(?:(<|>)(\w+))?$/', $order, $matches) === 1) {
            $first = $this->visibleSortKey($matches[2], $columnKeys);
            if ($first !== null) {
                $sortBy = $first;
                $sortDir = $matches[1] === '<' ? 'ASC' : 'DESC';
            }

            if (! empty($matches[4])) {
                $second = $this->visibleSortKey($matches[4], $columnKeys);
                if ($second !== null) {
                    $sortBy2 = $second;
                    $sortDir2 = $matches[3] === '<' ? 'ASC' : 'DESC';
                }
            }
        }

        return [$sortBy, $sortDir, $sortBy2, $sortDir2];
    }

    /**
     * @param  list<string>  $columnKeys
     */
    private function visibleSortKey(string $key, array $columnKeys): ?string
    {
        if (in_array($key, $columnKeys, true)) {
            return $key;
        }

        if (str_ends_with($key, '_name_SORT')) {
            $candidate = substr($key, 0, -strlen('_name_SORT')).'_ID';
            if (in_array($candidate, $columnKeys, true)) {
                return $candidate;
            }
        }

        return null;
    }
}
