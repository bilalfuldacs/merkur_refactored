<?php

namespace App\Services;

use App\Models\ConfigTable;
use App\Models\User;
use App\Support\NiceFieldName;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

class TableHistoryService
{
    public function __construct(private TableViewSchemaService $schema) {}

    /**
     * @return array{revisions: list<array<string, mixed>>}
     */
    public function forRecord(string $table, User $user, int $id): array
    {
        $view = $this->schema->payload($table, $user);
        $source = (string) ($view['source'] ?? '');
        if ($source === '' || ! $this->isSafeName($source) || ! Schema::hasTable($source)) {
            throw new InvalidArgumentException('Unknown table.');
        }

        $this->assertRecordVisible($source, $user, $id);

        $historyTable = $this->historyTable($source);
        if (! $this->tableExists($historyTable)) {
            $this->ensure($source);
        }
        if (! $this->tableExists($historyTable)) {
            return ['revisions' => []];
        }

        $rows = DB::table($historyTable)
            ->where('ID', $id)
            ->orderBy('revision')
            ->get()
            ->map(fn (object $row): array => (array) $row)
            ->all();

        if ($rows === []) {
            return ['revisions' => []];
        }

        $columns = $this->historyColumns($view);
        $relatedLabels = $this->relatedLabels($rows, $columns);
        $editors = $this->editors($rows);
        $previous = [];
        $revisions = [];

        foreach ($rows as $row) {
            $changes = [];
            $current = [];

            foreach ($columns as $column) {
                $key = $column['key'];
                $display = $this->displayValue($row[$key] ?? null, $column, $relatedLabels);
                $current[$key] = $display;
                $prior = $previous[$key] ?? null;
                if ($this->sameDisplay($prior, $display)) {
                    continue;
                }

                $changes[] = [
                    'key' => $key,
                    'label' => $column['label'],
                    'previous' => $prior,
                    'current' => $display,
                ];
            }

            $previous = $current;
            $editorId = $row['mod_by'] ?? null;
            $revisions[] = [
                'action' => (string) ($row['action'] ?? 'update'),
                'revision' => (int) ($row['revision'] ?? 0),
                'modified_at' => $row['mod_date'] ?? null,
                'editor' => is_numeric($editorId) ? ($editors[(int) $editorId] ?? null) : null,
                'changes' => $changes,
            ];
        }

        return ['revisions' => array_reverse($revisions)];
    }

    public function enableForCatalog(): int
    {
        $enabled = 0;
        $tables = ConfigTable::query()
            ->whereNotNull('title')
            ->orderBy('ID')
            ->get(['table']);

        foreach ($tables as $config) {
            $name = (string) $config->table;
            if (! $this->isSafeName($name) || ! Schema::hasTable($name)) {
                continue;
            }

            try {
                $this->ensure($name);
                $this->markConfigured($name);
                $enabled++;
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        return $enabled;
    }

    /**
     * Status overview for admin: which catalog tables have history enabled / tables present.
     *
     * @return array{command: string, tables: list<array{table: string, title: string, has_history: bool, history_table_exists: bool}>}
     */
    public function catalogStatus(): array
    {
        $rows = ConfigTable::query()
            ->whereNotNull('title')
            ->orderBy('ID')
            ->get(['table', 'title', 'has_history']);

        $tables = [];
        foreach ($rows as $config) {
            $name = (string) $config->table;
            if (! $this->isSafeName($name)) {
                continue;
            }
            $historyName = $this->historyTable($name);
            $tables[] = [
                'table' => $name,
                'title' => (string) $config->title,
                'has_history' => (bool) $config->has_history,
                'history_table_exists' => $this->tableExists($historyName),
            ];
        }

        return [
            'command' => 'php artisan merkur:enable-table-history',
            'tables' => $tables,
        ];
    }

    public function ensure(string $source): void
    {
        if (! $this->isSafeName($source) || ! Schema::hasTable($source)) {
            return;
        }

        $previousMode = (string) (DB::selectOne('SELECT @@SESSION.sql_mode AS mode')->mode ?? '');
        DB::unprepared("SET SESSION sql_mode = 'NO_AUTO_VALUE_ON_ZERO'");

        try {
            $historyTable = $this->historyTable($source);
            if (! $this->tableExists($historyTable)) {
                $this->createHistoryTable($source, $historyTable);
            }

            $this->createTriggers($source, $historyTable);
        } finally {
            DB::unprepared('SET SESSION sql_mode = '.DB::getPdo()->quote($previousMode));
        }
    }

    private function createHistoryTable(string $source, string $historyTable): void
    {
        DB::unprepared('CREATE TABLE `'.$historyTable.'` LIKE `'.$source.'`');
        $this->dropUniqueIndexes($historyTable);

        $insertColumns = $this->insertableColumns($historyTable);
        if ($insertColumns !== []) {
            $list = implode(', ', array_map(fn (string $column): string => '`'.$column.'`', $insertColumns));
            DB::unprepared("INSERT INTO `{$historyTable}` ({$list}) SELECT {$list} FROM `{$source}`");
        }

        $idType = (string) (DB::selectOne(
            'SELECT COLUMN_TYPE AS column_type
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [$historyTable, 'ID'],
        )->column_type ?? 'int(11)');

        DB::unprepared(
            "ALTER TABLE `{$historyTable}`
                MODIFY COLUMN `ID` {$idType} NOT NULL,
                DROP PRIMARY KEY,
                ENGINE = MyISAM,
                ADD `action` ENUM('insert','update','delete') DEFAULT 'insert' FIRST,
                ADD `revision` INT(6) NOT NULL AUTO_INCREMENT AFTER `action`,
                ADD PRIMARY KEY (`ID`, `revision`)"
        );
    }

    private function dropUniqueIndexes(string $table): void
    {
        $names = [];
        foreach (DB::select('SHOW INDEX FROM `'.$table.'`') as $index) {
            $name = (string) ($index->Key_name ?? '');
            if ($name !== '' && $name !== 'PRIMARY' && (int) ($index->Non_unique ?? 1) === 0) {
                $names[$name] = true;
            }
        }

        foreach (array_keys($names) as $name) {
            if (! $this->isSafeName($name) && ! preg_match('/^[A-Za-z0-9_-]+$/', $name)) {
                continue;
            }

            DB::unprepared('ALTER TABLE `'.$table.'` DROP INDEX `'.$name.'`');
        }
    }

    private function createTriggers(string $source, string $historyTable): void
    {
        $existing = collect(DB::select('SHOW TRIGGERS LIKE \''.$source.'\''))
            ->pluck('Trigger')
            ->filter(fn (mixed $name): bool => is_string($name))
            ->all();

        $needed = [
            $source.'__ai' => "CREATE TRIGGER `{$source}__ai` AFTER INSERT ON `{$source}` FOR EACH ROW
                INSERT INTO `{$historyTable}` SELECT 'insert', NULL, d.* FROM `{$source}` AS d WHERE d.ID = NEW.ID",
            $source.'__au' => "CREATE TRIGGER `{$source}__au` AFTER UPDATE ON `{$source}` FOR EACH ROW
                INSERT INTO `{$historyTable}` SELECT 'update', NULL, d.* FROM `{$source}` AS d WHERE d.ID = NEW.ID",
            $source.'__bd' => "CREATE TRIGGER `{$source}__bd` BEFORE DELETE ON `{$source}` FOR EACH ROW
                INSERT INTO `{$historyTable}` SELECT 'delete', NULL, d.* FROM `{$source}` AS d WHERE d.ID = OLD.ID",
        ];

        foreach ($needed as $name => $sql) {
            if (in_array($name, $existing, true)) {
                continue;
            }

            DB::unprepared('DROP TRIGGER IF EXISTS `'.$name.'`');
            DB::unprepared($sql);
        }
    }

    /**
     * @return list<string>
     */
    private function insertableColumns(string $table): array
    {
        return collect(DB::select(
            'SELECT COLUMN_NAME AS name, EXTRA AS extra
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
             ORDER BY ORDINAL_POSITION',
            [$table],
        ))->filter(function (object $column): bool {
            $extra = strtolower((string) ($column->extra ?? ''));

            return ! str_contains($extra, 'generated') && ! in_array((string) $column->name, ['action', 'revision'], true);
        })->map(fn (object $column): string => (string) $column->name)->values()->all();
    }

    private function markConfigured(string $table): void
    {
        ConfigTable::query()->where('table', $table)->update(['has_history' => true]);
    }

    private function assertRecordVisible(string $source, User $user, int $id): void
    {
        $query = DB::table($source)->where('ID', $id);
        if (in_array($source, ['markets_landbased', 'markets_online'], true) && ! $user->canAccessUnsubscribedMarkets()) {
            $query->whereIn('jurisdiction_ID', $user->jurisdictionStakes()->select('jurisdiction_ID'));
        }

        if (! $query->exists()) {
            throw new InvalidArgumentException('Unknown record.');
        }
    }

    /**
     * @param  array<string, mixed>  $view
     * @return list<array{key: string, label: string, kind: string, related_table: ?string, related_display: ?string}>
     */
    private function historyColumns(array $view): array
    {
        $columns = [];
        foreach ($view['columns'] ?? [] as $column) {
            if (! is_array($column)) {
                continue;
            }

            $key = (string) ($column['key'] ?? '');
            if ($key === '' || $key === 'ID' || str_ends_with($key, '_SORT') || str_ends_with($key, '_COMBINED')) {
                continue;
            }

            $columns[] = [
                'key' => $key,
                'label' => (string) ($column['label'] ?? NiceFieldName::label($key)),
                'kind' => (string) ($column['kind'] ?? 'text'),
                'related_table' => is_string($column['related_table'] ?? null) ? $column['related_table'] : null,
                'related_display' => is_string($column['related_display'] ?? null) ? $column['related_display'] : null,
            ];
        }

        return $columns;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @param  list<array{key: string, label: string, kind: string, related_table: ?string, related_display: ?string}>  $columns
     * @return array<string, array<int, string>>
     */
    private function relatedLabels(array $rows, array $columns): array
    {
        $idsByTable = [];
        $displayByTable = [];

        foreach ($columns as $column) {
            if ($column['kind'] !== 'relation' || $column['related_table'] === null || ! $this->isSafeName($column['related_table'])) {
                continue;
            }

            $relatedTable = $column['related_table'];
            $displayByTable[$relatedTable] = $column['related_display'] ?? 'name';
            $idsByTable[$relatedTable] ??= [];
            foreach ($rows as $row) {
                $value = $row[$column['key']] ?? null;
                if (is_numeric($value)) {
                    $idsByTable[$relatedTable][(int) $value] = (int) $value;
                }
            }
        }

        $labels = [];
        foreach ($idsByTable as $relatedTable => $ids) {
            $labels[$relatedTable] = [];
            if ($ids === [] || ! Schema::hasTable($relatedTable)) {
                continue;
            }

            $display = $displayByTable[$relatedTable] ?? 'name';
            $labelColumn = Schema::hasColumn($relatedTable, (string) $display)
                ? (string) $display
                : (Schema::hasColumn($relatedTable, 'name') ? 'name' : 'ID');

            DB::table($relatedTable)
                ->select(['ID', $labelColumn])
                ->whereIn('ID', array_values($ids))
                ->get()
                ->each(function (object $related) use (&$labels, $relatedTable, $labelColumn): void {
                    $text = trim((string) ($related->{$labelColumn} ?? ''));
                    $labels[$relatedTable][(int) $related->ID] = $text !== '' ? $text : '#'.$related->ID;
                });
        }

        return $labels;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return array<int, array<string, mixed>>
     */
    private function editors(array $rows): array
    {
        $ids = [];
        foreach ($rows as $row) {
            $value = $row['mod_by'] ?? null;
            if (is_numeric($value)) {
                $ids[(int) $value] = (int) $value;
            }
        }

        if ($ids === [] || ! Schema::hasTable('dynamic__users')) {
            return [];
        }

        $editors = [];
        DB::table('dynamic__users')
            ->whereIn('ID', array_values($ids))
            ->get()
            ->each(function (object $user) use (&$editors): void {
                $editors[(int) $user->ID] = [
                    'ID' => $user->ID,
                    'firstname' => $user->firstname ?? null,
                    'lastname' => $user->lastname ?? null,
                    'initials' => $user->initials ?? null,
                    'bcolor' => $user->bcolor ?? null,
                    'color' => $user->color ?? null,
                    'role_ID' => $user->role_ID ?? null,
                ];
            });

        return $editors;
    }

    /**
     * @param  array{key: string, label: string, kind: string, related_table: ?string, related_display: ?string}  $column
     * @param  array<string, array<int, string>>  $relatedLabels
     */
    private function displayValue(mixed $value, array $column, array $relatedLabels): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($column['kind'] === 'relation') {
            $relatedTable = $column['related_table'];
            if (is_numeric($value) && $relatedTable !== null) {
                return $relatedLabels[$relatedTable][(int) $value] ?? '#'.$value;
            }

            return is_scalar($value) ? (string) $value : null;
        }

        if ($column['kind'] === 'boolean') {
            return $value === true || $value === 1 || $value === '1' || $value === 'true' ? 'Yes' : 'No';
        }

        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        if (is_array($value) || is_object($value)) {
            $encoded = json_encode($value, JSON_UNESCAPED_UNICODE);

            return $encoded === false ? null : $encoded;
        }

        return (string) $value;
    }

    private function sameDisplay(?string $left, ?string $right): bool
    {
        return ($left ?? '') === ($right ?? '');
    }

    private function tableExists(string $table): bool
    {
        if (! $this->isSafeName($table)) {
            return false;
        }

        return DB::select('SHOW TABLES LIKE '.$this->quoted($table)) !== [];
    }

    private function quoted(string $value): string
    {
        return DB::getPdo()->quote($value);
    }

    private function historyTable(string $source): string
    {
        return $source.'_history';
    }

    private function isSafeName(string $name): bool
    {
        return (bool) preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $name);
    }
}
