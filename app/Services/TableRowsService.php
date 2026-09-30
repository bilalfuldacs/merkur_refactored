<?php

namespace App\Services;

use App\Models\ConfigStatus;
use App\Models\Jurisdiction;
use App\Models\MarketLandbased;
use App\Models\MarketOnline;
use App\Models\TableViewRecord;
use App\Models\User;
use App\Support\TableResourceBinding;
use App\Support\TableResourceMap;
use App\Support\TableViewQuery;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Request;
use Illuminate\Routing\Redirector;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

class TableRowsService
{
    private const RELATED_SEARCH_COLUMNS = [
        'name',
        'name2',
        'name_COMBINED',
        'name_name2_COMBINED',
        'long_name_COMBINED',
        'name_english',
        'firstname',
        'lastname',
        'username',
        'ID_text',
    ];

    private const RELATED_DISPLAY_COLUMNS = [
        'name',
        'name2',
        'name_SORT',
        'name_name2_COMBINED',
        'name_COMBINED',
        'long_name_COMBINED',
        'name_english',
        'firstname',
        'lastname',
        'username',
        'ID_text',
        'type',
    ];

    public function __construct(private TableViewSchemaService $schema) {}

    /**
     * @return array{data: list<array<string, mixed>>, meta: array<string, mixed>}
     */
    public function paginate(string $table, User $user, Request $request): array
    {
        $view = $this->schema->payload($table, $user);
        $source = (string) ($view['source'] ?? '');
        if ($source === '' || ! Schema::hasTable($source)) {
            throw new InvalidArgumentException('Unknown table.');
        }

        $model = new TableViewRecord;
        $model->setTable($source);

        $query = $model->newQuery()->select($source.'.*');
        $this->applyVisibility($query, $source, $user);
        $this->applySearch($query, $source, $view, trim((string) $request->query('q', '')));
        TableViewQuery::applySorts($query, $request, $view);

        $page = $query->paginate(TableViewQuery::perPage($request))->withQueryString();

        return [
            'data' => $this->hydrateRows($page->getCollection()->all(), $view),
            'meta' => [
                'current_page' => $page->currentPage(),
                'from' => $page->firstItem(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'to' => $page->lastItem(),
                'total' => $page->total(),
            ],
        ];
    }

    /**
     * @return array{
     *     table: string,
     *     title: string,
     *     icon: string|null,
     *     color: string,
     *     columns: list<array{key: string, label: string}>,
     *     rows: list<array{id: mixed, modified_at: mixed, editor: array<string, mixed>|null, cells: list<string>}>
     * }
     */
    public function recentModified(string $table, User $user, int $limit): array
    {
        [$view, $source, $model] = $this->queryContext($table, $user);

        $query = $model->newQuery()->select($source.'.*');
        $this->applyVisibility($query, $source, $user);
        if (Schema::hasColumn($source, 'mod_date')) {
            $query->orderByDesc($source.'.mod_date');
        } else {
            $query->orderByDesc($source.'.ID');
        }

        $hydrated = $this->hydrateRows(
            $query->limit(max(1, $limit))->get()->all(),
            $view,
            withEditor: true,
        );

        $columnByKey = [];
        foreach ($view['columns'] ?? [] as $column) {
            if (is_array($column) && isset($column['key'])) {
                $columnByKey[(string) $column['key']] = $column;
            }
        }

        $visible = is_array($view['defaults']['visible_columns'] ?? null)
            ? $view['defaults']['visible_columns']
            : [];

        $columns = [];
        foreach ($visible as $key) {
            $key = (string) $key;
            if ($key === '' || $key === 'mod_date' || $key === 'mod_by' || ! isset($columnByKey[$key])) {
                continue;
            }
            $columns[] = [
                'key' => $key,
                'label' => (string) ($columnByKey[$key]['label'] ?? $key),
            ];
        }

        $rows = [];
        foreach ($hydrated as $row) {
            $cells = [];
            foreach ($columns as $column) {
                $spec = $columnByKey[$column['key']];
                $text = $this->exportCellText($row, [
                    'key' => (string) $spec['key'],
                    'label' => (string) ($spec['label'] ?? $spec['key']),
                    'kind' => (string) ($spec['kind'] ?? 'text'),
                    'relation_key' => $spec['relation_key'] ?? null,
                ]);
                $cells[] = $this->truncateChangeCell($text);
            }

            $rows[] = [
                'id' => $row['ID'] ?? null,
                'modified_at' => $row['mod_date'] ?? null,
                'editor' => is_array($row['editor'] ?? null) ? $row['editor'] : null,
                'cells' => $cells,
            ];
        }

        return [
            'table' => (string) $view['table'],
            'title' => (string) $view['title'],
            'icon' => $view['icon'] ?? null,
            'color' => (string) ($view['color'] ?? '#E83181'),
            'columns' => $columns,
            'rows' => $rows,
        ];
    }

    private function truncateChangeCell(string $value): string
    {
        if ($value === '' || mb_strlen($value) <= 45) {
            return $value;
        }

        return mb_substr($value, 0, 20).'…'.mb_substr($value, -20);
    }

    /**
     * @return array{
     *     table: string,
     *     title: string,
     *     infobox: string,
     *     generated_for: string,
     *     columns: list<array{key: string, label: string, kind: string, relation_key: ?string}>,
     *     rows: list<list<string>>
     * }
     */
    public function exportDataset(string $table, User $user, Request $request): array
    {
        $view = $this->schema->payload($table, $user);
        $source = (string) ($view['source'] ?? '');
        if ($source === '' || ! Schema::hasTable($source)) {
            throw new InvalidArgumentException('Unknown table.');
        }

        $model = new TableViewRecord;
        $model->setTable($source);

        $query = $model->newQuery()->select($source.'.*');
        $this->applyVisibility($query, $source, $user);
        TableViewQuery::applySorts($query, $request, $view);

        $columns = $this->exportColumns($view, $request);
        $rows = [];
        $offset = 0;
        $batch = 500;

        do {
            $page = (clone $query)->offset($offset)->limit($batch)->get();
            $count = $page->count();
            foreach ($this->hydrateRows($page->all(), $view) as $row) {
                $rows[] = $this->flattenExportRow($row, $columns);
            }
            $offset += $batch;
        } while ($count === $batch);

        return [
            'table' => (string) ($view['table'] ?? $table),
            'title' => (string) ($view['title'] ?? $table),
            'infobox' => (string) ($view['infobox'] ?? ''),
            'generated_for' => trim($user->firstname.' '.$user->lastname) ?: (string) $user->username,
            'columns' => $columns,
            'rows' => $rows,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function find(string $table, User $user, int $id): array
    {
        [$view, $source, $model] = $this->queryContext($table, $user);

        $record = $model->newQuery()
            ->select($source.'.*')
            ->where($source.'.ID', $id);
        $this->applyVisibility($record, $source, $user);
        $found = $record->first();

        if ($found === null) {
            throw new InvalidArgumentException('Unknown record.');
        }

        return $this->hydrateRows([$found], $view, withEditor: true)[0];
    }

    /**
     * @return array<string, mixed>
     */
    public function store(string $table, User $user, Request $request): array
    {
        [$view, $source] = $this->queryContext($table, $user);
        $this->assertCanEdit($view);

        $binding = TableResourceMap::forSource($source);
        if ($binding === null) {
            abort(405, 'This table cannot be created through the table API.');
        }

        $tagSelections = $this->tagSelections($request, $view);
        $validated = $this->validateFormRequest(
            $request,
            $binding->storeRequest,
            $binding->parameter,
            null,
            $this->preparePayload($request, $view),
        );

        return DB::transaction(function () use ($table, $user, $binding, $validated, $tagSelections): array {
            $record = new $binding->model;
            $this->persist($record, $user, $validated, creating: true);
            $this->syncTags((int) $record->getKey(), $user, $tagSelections);

            return $this->find($table, $user, (int) $record->getKey());
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function update(string $table, User $user, int $id, Request $request): array
    {
        [$view, $source, $generic] = $this->queryContext($table, $user);
        $this->assertCanEdit($view);

        $tagSelections = $this->tagSelections($request, $view);
        $binding = TableResourceMap::forSource($source);

        return DB::transaction(function () use ($table, $user, $id, $request, $view, $source, $generic, $binding, $tagSelections): array {
            if ($binding !== null) {
                $record = $this->findBoundRecord($binding, $id);
                $validated = $this->validateFormRequest(
                    $request,
                    $binding->updateRequest,
                    $binding->parameter,
                    $record,
                    $this->preparePayload($request, $view),
                );
                $this->persist($record, $user, $validated, creating: false);
                $this->syncTags($id, $user, $tagSelections);

                return $this->find($table, $user, $id);
            }

            $record = $generic->newQuery()->where($source.'.ID', $id)->first();
            if ($record === null) {
                throw new InvalidArgumentException('Unknown record.');
            }

            foreach ($this->writableColumns($view) as $column) {
                $key = (string) $column['key'];
                if (! $request->exists($key)) {
                    continue;
                }

                $record->setAttribute($key, $this->normalizeValue($column, $request->input($key)));
            }

            $this->touchEditor($record, $user, $source);
            $record->save();
            $this->syncTags($id, $user, $tagSelections);

            return $this->find($table, $user, $id);
        });
    }

    public function destroy(string $table, User $user, int $id): void
    {
        [, $source] = $this->queryContext($table, $user);
        $binding = TableResourceMap::forSource($source);
        if ($binding === null) {
            abort(405, 'This table cannot be deleted through the table API.');
        }

        $record = $this->findBoundRecord($binding, $id);
        Gate::forUser($user)->authorize('delete', $record);
        $record->delete();
    }

    /**
     * @return array<string, list<array{id: int, label: string}>>
     */
    public function lookups(string $table, User $user): array
    {
        $view = $this->schema->payload($table, $user);
        $lookups = [];

        foreach ($view['columns'] ?? [] as $column) {
            if (! is_array($column) || ($column['kind'] ?? null) !== 'relation') {
                continue;
            }

            $key = (string) ($column['key'] ?? '');
            $relatedTable = (string) ($column['related_table'] ?? '');
            $display = (string) ($column['related_display'] ?? 'name');
            if ($key === '' || ! $this->isSafeTable($relatedTable) || ! Schema::hasTable($relatedTable)) {
                continue;
            }

            $labelColumn = Schema::hasColumn($relatedTable, $display)
                ? $display
                : (Schema::hasColumn($relatedTable, 'name') ? 'name' : 'ID');
            $orderColumn = $column['sort_join']['column'] ?? $labelColumn;
            if (! is_string($orderColumn) || ! Schema::hasColumn($relatedTable, $orderColumn)) {
                $orderColumn = $labelColumn;
            }

            $lookups[$key] = DB::table($relatedTable)
                ->select(array_values(array_unique(['ID', $labelColumn])))
                ->orderBy($orderColumn)
                ->limit(2000)
                ->get()
                ->map(function (object $row) use ($labelColumn): array {
                    $label = trim((string) ($row->{$labelColumn} ?? ''));

                    return [
                        'id' => (int) $row->ID,
                        'label' => $label !== '' ? $label : '#'.$row->ID,
                    ];
                })
                ->all();
        }

        foreach ($view['columns'] ?? [] as $column) {
            if (! is_array($column) || ($column['kind'] ?? null) !== 'tags') {
                continue;
            }

            $key = (string) ($column['key'] ?? '');
            $mapping = is_array($column['tag_mapping'] ?? null) ? $column['tag_mapping'] : null;
            if ($key === '' || $mapping === null) {
                continue;
            }

            $lookups[$key] = $this->tagLookupOptions($mapping);
        }

        return $lookups;
    }

    /**
     * @param  array<string, mixed>  $view
     */
    private function assertCanEdit(array $view): void
    {
        if (! ($view['can_edit'] ?? false)) {
            abort(403, 'You cannot edit this table.');
        }
    }

    private function findBoundRecord(TableResourceBinding $binding, int $id): Model
    {
        $record = $binding->model::query()->find($id);
        if (! $record instanceof Model) {
            throw new InvalidArgumentException('Unknown record.');
        }

        return $record;
    }

    /**
     * @param  class-string<FormRequest>  $formRequestClass
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function validateFormRequest(
        Request $request,
        string $formRequestClass,
        string $parameter,
        ?Model $model,
        array $payload,
    ): array {
        /** @var FormRequest $form */
        $form = $formRequestClass::createFrom($request);
        $form->setContainer(app());
        $form->setRedirector(app(Redirector::class));
        $form->replace($payload);

        $route = $request->route();
        if ($route !== null && $model !== null) {
            $route->setParameter($parameter, $model);
            $form->setRouteResolver(static fn () => $route);
        }

        $form->validateResolved();

        return $form->validated();
    }

    /**
     * @param  array<string, mixed>  $view
     * @return array<string, mixed>
     */
    private function preparePayload(Request $request, array $view): array
    {
        $payload = $request->all();
        $columns = [];

        foreach ($view['columns'] ?? [] as $column) {
            if (! is_array($column)) {
                continue;
            }

            $key = (string) ($column['key'] ?? '');
            if ($key !== '') {
                $columns[$key] = $column;
            }
        }

        foreach ($payload as $key => $value) {
            if (! is_string($key) || ! isset($columns[$key])) {
                continue;
            }

            $kind = (string) ($columns[$key]['kind'] ?? 'text');
            $nullable = (bool) ($columns[$key]['nullable'] ?? false);

            if ($kind === 'tags') {
                unset($payload[$key]);

                continue;
            }

            if (in_array($kind, ['json', 'matrix'], true) && is_string($value) && $value !== '') {
                $decoded = json_decode($value, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $payload[$key] = $decoded;

                    continue;
                }
            }

            if ($kind === 'boolean' && ($value === null || $value === '')) {
                unset($payload[$key]);

                continue;
            }

            if (($value === '' || $value === null) && ($nullable || $kind === 'relation')) {
                $payload[$key] = null;
            }
        }

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function persist(Model $model, User $user, array $validated, bool $creating): void
    {
        if ($model instanceof User) {
            $this->persistUser($model, $validated);

            return;
        }

        $model->fill($this->withoutTagValues($validated));

        if ($model instanceof ConfigStatus && $creating) {
            $model->text_color ??= '#ffffff';
        }

        if ($model instanceof Jurisdiction && ($creating || array_key_exists('segment_name', $validated))) {
            $model->segment_name = $validated['segment_name'] ?? $model->segment_name ?? '';
        }

        if (
            ($model instanceof MarketLandbased || $model instanceof MarketOnline)
            && ($creating || array_key_exists('jurisdiction_ID', $validated))
            && method_exists($model, 'syncJurisdictionSegment')
        ) {
            $model->syncJurisdictionSegment();
        }

        $this->touchEditor($model, $user, $model->getTable());
        $model->save();
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function persistUser(User $model, array $validated): void
    {
        if (array_key_exists('password', $validated)) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $model->fill($validated);

        if (array_key_exists('role_ID', $validated)) {
            $model->assignRole((int) $validated['role_ID']);

            return;
        }

        $model->save();
    }

    private function touchEditor(Model $model, User $user, string $table): void
    {
        if (Schema::hasColumn($table, 'mod_by')) {
            $model->setAttribute('mod_by', $user->ID);
        }
        if (Schema::hasColumn($table, 'mod_date')) {
            $model->setAttribute('mod_date', now());
        }
    }

    /**
     * @param  array<string, mixed>  $view
     * @return list<array{key: string, label: string, kind: string, relation_key: ?string}>
     */
    private function exportColumns(array $view, Request $request): array
    {
        $available = [];
        foreach ($view['columns'] ?? [] as $column) {
            if (! is_array($column)) {
                continue;
            }

            $key = (string) ($column['key'] ?? '');
            if ($key === '') {
                continue;
            }

            $available[$key] = [
                'key' => $key,
                'label' => (string) ($column['label'] ?? $key),
                'kind' => (string) ($column['kind'] ?? 'text'),
                'relation_key' => is_string($column['relation_key'] ?? null) ? $column['relation_key'] : null,
            ];
        }

        $requested = $request->query('columns');
        $keys = [];
        if (is_string($requested) && trim($requested) !== '') {
            $keys = array_values(array_filter(array_map('trim', explode(',', $requested))));
        } elseif (is_array($requested)) {
            $keys = array_values(array_filter(array_map('strval', $requested)));
        }

        if ($keys === []) {
            return array_values($available);
        }

        $selected = [];
        foreach ($keys as $key) {
            if (isset($available[$key])) {
                $selected[] = $available[$key];
            }
        }

        return $selected !== [] ? $selected : array_values($available);
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  list<array{key: string, label: string, kind: string, relation_key: ?string}>  $columns
     * @return list<string>
     */
    private function flattenExportRow(array $row, array $columns): array
    {
        $values = [];
        foreach ($columns as $column) {
            $values[] = $this->exportCellText($row, $column);
        }

        return $values;
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  array{key: string, label: string, kind: string, relation_key: ?string}  $column
     */
    private function exportCellText(array $row, array $column): string
    {
        $kind = $column['kind'];
        $key = $column['key'];

        if ($kind === 'relation') {
            return $this->relatedDisplayName($row[$column['relation_key'] ?? ''] ?? null);
        }

        $value = $row[$key] ?? null;
        if ($value === null || $value === '') {
            return '';
        }

        if ($kind === 'boolean') {
            return $value === true || $value === 1 || $value === '1' || $value === 'true' ? 'Yes' : 'No';
        }

        if ($kind === 'tags') {
            return $this->tagNamesText($value);
        }

        if (in_array($kind, ['json', 'matrix'], true) && ! is_string($value)) {
            $encoded = json_encode($value, JSON_UNESCAPED_UNICODE);

            return $encoded === false ? '' : $encoded;
        }

        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        if (is_array($value) || is_object($value)) {
            $encoded = json_encode($value, JSON_UNESCAPED_UNICODE);

            return $encoded === false ? '' : $encoded;
        }

        return (string) $value;
    }

    private function relatedDisplayName(mixed $related): string
    {
        if (! is_array($related)) {
            return is_scalar($related) ? (string) $related : '';
        }

        foreach (['name_name2_COMBINED', 'long_name_COMBINED', 'name_COMBINED', 'name', 'name_english'] as $field) {
            $value = trim((string) ($related[$field] ?? ''));
            if ($value !== '') {
                return $value;
            }
        }

        $person = trim(trim((string) ($related['firstname'] ?? '')).' '.trim((string) ($related['lastname'] ?? '')));
        if ($person !== '') {
            return $person;
        }

        return trim((string) ($related['username'] ?? ''));
    }

    /**
     * @return array{0: array<string, mixed>, 1: string, 2: TableViewRecord}
     */
    private function queryContext(string $table, User $user): array
    {
        $view = $this->schema->payload($table, $user);
        $source = (string) ($view['source'] ?? '');
        if ($source === '' || ! Schema::hasTable($source)) {
            throw new InvalidArgumentException('Unknown table.');
        }

        $model = new TableViewRecord;
        $model->setTable($source);

        return [$view, $source, $model];
    }

    /**
     * @param  Builder<*>  $query
     */
    private function applyVisibility(Builder $query, string $source, User $user): void
    {
        if (! in_array($source, ['markets_landbased', 'markets_online'], true)) {
            return;
        }

        if ($user->canAccessUnsubscribedMarkets()) {
            return;
        }

        $query->whereIn(
            $source.'.jurisdiction_ID',
            $user->jurisdictionStakes()->select('jurisdiction_ID'),
        );
    }

    /**
     * @param  Builder<*>  $query
     * @param  array<string, mixed>  $schema
     */
    private function applySearch(Builder $query, string $source, array $schema, string $queryText): void
    {
        if ($queryText === '') {
            return;
        }

        $like = '%'.$queryText.'%';
        $columns = is_array($schema['columns'] ?? null) ? $schema['columns'] : [];

        $query->where(function (Builder $builder) use ($source, $columns, $like, $queryText): void {
            $matched = false;

            if (preg_match('/^\d+$/', $queryText) === 1) {
                $builder->orWhere($source.'.ID', (int) $queryText);
                $matched = true;
            }

            foreach ($columns as $column) {
                if (! is_array($column)) {
                    continue;
                }

                $key = (string) ($column['key'] ?? '');
                $kind = (string) ($column['kind'] ?? '');

                if ($this->isSafeColumn($key) && in_array($kind, ['text', 'url', 'json', 'matrix'], true)) {
                    $builder->orWhere($source.'.'.$key, 'like', $like);
                    $matched = true;
                }

                $mapping = is_array($column['tag_mapping'] ?? null) ? $column['tag_mapping'] : null;
                if ($kind === 'tags' && $mapping !== null) {
                    $builder->orWhereExists(function ($exists) use ($source, $mapping, $like): void {
                        $exists->from($mapping['mappingTable'].' as map')
                            ->join($mapping['tagsTable'].' as tag', 'tag.ID', '=', 'map.'.$mapping['tagColumn'])
                            ->whereColumn('map.'.$mapping['masterColumn'], $source.'.ID')
                            ->where('tag.'.$mapping['tagNameColumn'], 'like', $like);
                    });
                    $matched = true;
                }

                $join = is_array($column['sort_join'] ?? null) ? $column['sort_join'] : null;
                if ($join === null || ! $this->isSafeColumn($key)) {
                    continue;
                }

                $relatedTable = (string) ($join['table'] ?? '');
                if (! $this->isSafeTable($relatedTable) || ! Schema::hasTable($relatedTable)) {
                    continue;
                }

                $searchColumns = $this->searchableRelatedColumns($relatedTable);
                if ($searchColumns === []) {
                    continue;
                }

                $builder->orWhereExists(function ($exists) use ($source, $key, $relatedTable, $searchColumns, $like): void {
                    $exists->from($relatedTable)
                        ->whereColumn($relatedTable.'.ID', $source.'.'.$key)
                        ->where(function ($related) use ($relatedTable, $searchColumns, $like): void {
                            foreach ($searchColumns as $searchColumn) {
                                $related->orWhere($relatedTable.'.'.$searchColumn, 'like', $like);
                            }
                        });
                });
                $matched = true;
            }

            if (! $matched) {
                $builder->whereRaw('0 = 1');
            }
        });
    }

    /**
     * @param  list<TableViewRecord>  $records
     * @param  array<string, mixed>  $schema
     * @return list<array<string, mixed>>
     */
    private function hydrateRows(array $records, array $schema, bool $withEditor = false): array
    {
        $columns = is_array($schema['columns'] ?? null) ? $schema['columns'] : [];
        $allowed = ['ID' => true];
        $relations = [];

        foreach ($columns as $column) {
            if (! is_array($column)) {
                continue;
            }

            $key = (string) ($column['key'] ?? '');
            if ($key !== '') {
                $allowed[$key] = true;
            }

            $relationKey = $column['relation_key'] ?? null;
            $join = is_array($column['sort_join'] ?? null) ? $column['sort_join'] : null;
            if (! is_string($relationKey) || $relationKey === '' || $join === null) {
                continue;
            }

            $relatedTable = (string) ($join['table'] ?? '');
            if (! $this->isSafeTable($relatedTable) || ! Schema::hasTable($relatedTable)) {
                continue;
            }

            $allowed[$relationKey] = true;
            $relations[] = [
                'key' => $key,
                'relation_key' => $relationKey,
                'table' => $relatedTable,
            ];
        }

        $relatedRows = $this->loadRelatedRows($records, $relations);
        $tagValues = $this->loadTagValues($records, $columns);
        $editors = $withEditor ? $this->loadEditors($records) : [];
        $payloads = [];

        foreach ($records as $record) {
            $attributes = $record->getAttributes();
            $row = [];

            foreach ($allowed as $field => $enabled) {
                if ($enabled && array_key_exists($field, $attributes)) {
                    $row[$field] = $attributes[$field];
                }
            }

            foreach ($relations as $relation) {
                $foreignId = $attributes[$relation['key']] ?? null;
                $related = is_numeric($foreignId)
                    ? ($relatedRows[$relation['table']][(int) $foreignId] ?? null)
                    : null;
                $row[$relation['relation_key']] = $related;
            }

            $recordId = is_numeric($attributes['ID'] ?? null) ? (int) $attributes['ID'] : 0;
            foreach ($tagValues as $key => $byMaster) {
                $row[$key] = $recordId > 0 ? ($byMaster[$recordId] ?? []) : [];
            }

            if ($withEditor) {
                $row['mod_date'] = $attributes['mod_date'] ?? null;
                $editorId = $attributes['mod_by'] ?? null;
                $row['editor'] = is_numeric($editorId) ? ($editors[(int) $editorId] ?? null) : null;
            }

            $payloads[] = $row;
        }

        return $payloads;
    }

    /**
     * @param  list<TableViewRecord>  $records
     * @return array<int, array<string, mixed>>
     */
    private function loadEditors(array $records): array
    {
        $ids = [];
        foreach ($records as $record) {
            $value = $record->getAttribute('mod_by');
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
     * @param  array<string, mixed>  $schema
     * @return list<array<string, mixed>>
     */
    private function writableColumns(array $schema): array
    {
        $columns = [];
        foreach ($schema['columns'] ?? [] as $column) {
            if (! is_array($column)) {
                continue;
            }

            $key = (string) ($column['key'] ?? '');
            $kind = (string) ($column['kind'] ?? '');
            if ($key === '' || $kind === 'id' || $kind === 'tags' || ($column['disabled'] ?? false) || ($column['primary'] ?? false)) {
                continue;
            }

            if (! $this->isSafeColumn($key)) {
                continue;
            }

            $columns[] = $column;
        }

        return $columns;
    }

    /**
     * @param  array<string, mixed>  $column
     */
    private function normalizeValue(array $column, mixed $value): mixed
    {
        $kind = (string) ($column['kind'] ?? 'text');
        $nullable = (bool) ($column['nullable'] ?? false);

        if ($value === '' || $value === null) {
            return $nullable || $kind === 'relation' ? null : $value;
        }

        return match ($kind) {
            'boolean' => $value === true || $value === 1 || $value === '1' || $value === 'true' ? 1 : 0,
            'relation' => is_numeric($value) ? (int) $value : null,
            'json', 'matrix' => is_string($value) ? $value : json_encode($value),
            default => $value,
        };
    }

    /**
     * @param  list<TableViewRecord>  $records
     * @param  list<array{key: string, relation_key: string, table: string}>  $relations
     * @return array<string, array<int, array<string, mixed>>>
     */
    private function loadRelatedRows(array $records, array $relations): array
    {
        $idsByTable = [];

        foreach ($relations as $relation) {
            $idsByTable[$relation['table']] ??= [];
            foreach ($records as $record) {
                $value = $record->getAttribute($relation['key']);
                if (is_numeric($value)) {
                    $idsByTable[$relation['table']][(int) $value] = (int) $value;
                }
            }
        }

        $loaded = [];

        foreach ($idsByTable as $table => $ids) {
            $loaded[$table] = [];
            if ($ids === []) {
                continue;
            }

            $columns = array_values(array_filter(
                ['ID', ...self::RELATED_DISPLAY_COLUMNS],
                fn (string $column): bool => Schema::hasColumn($table, $column),
            ));

            DB::table($table)
                ->select($columns)
                ->whereIn('ID', array_values($ids))
                ->get()
                ->each(function (object $related) use (&$loaded, $table): void {
                    $loaded[$table][(int) $related->ID] = $this->relatedPayload($related);
                });
        }

        return $loaded;
    }

    /**
     * @return array<string, mixed>
     */
    private function relatedPayload(object $related): array
    {
        $payload = ['ID' => $related->ID ?? null];

        foreach (self::RELATED_DISPLAY_COLUMNS as $column) {
            if (isset($related->{$column})) {
                $payload[$column] = $related->{$column};
            }
        }

        if (! isset($payload['name']) || trim((string) $payload['name']) === '') {
            $payload['name'] = $payload['long_name_COMBINED']
                ?? $payload['name_name2_COMBINED']
                ?? $payload['name_COMBINED']
                ?? $payload['name_english']
                ?? $payload['name']
                ?? null;
        }

        return $payload;
    }

    /**
     * @return list<string>
     */
    private function searchableRelatedColumns(string $table): array
    {
        return array_values(array_filter(
            self::RELATED_SEARCH_COLUMNS,
            fn (string $column): bool => Schema::hasColumn($table, $column),
        ));
    }

    private function isSafeTable(string $name): bool
    {
        return (bool) preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $name);
    }

    private function isSafeColumn(string $name): bool
    {
        return (bool) preg_match('/^[A-Za-z0-9_]+$/', $name);
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    private function withoutTagValues(array $values): array
    {
        foreach ($values as $key => $value) {
            if (is_array($value) && $this->looksLikeTagList($value)) {
                unset($values[$key]);
            }
        }

        return $values;
    }

    /**
     * @param  array<int|string, mixed>  $value
     */
    private function looksLikeTagList(array $value): bool
    {
        foreach ($value as $item) {
            if (is_array($item) && (isset($item['id']) || isset($item['ID']) || isset($item['name']))) {
                return true;
            }
            if (is_int($item) || (is_string($item) && ctype_digit($item))) {
                return true;
            }
        }

        return $value === [];
    }

    /**
     * @param  array<string, mixed>  $view
     * @return list<array{mapping: array<string, string>, ids: list<int>}>
     */
    private function tagSelections(Request $request, array $view): array
    {
        $selections = [];
        foreach ($view['columns'] ?? [] as $column) {
            if (! is_array($column) || ($column['kind'] ?? null) !== 'tags') {
                continue;
            }

            $key = (string) ($column['key'] ?? '');
            $mapping = is_array($column['tag_mapping'] ?? null) ? $column['tag_mapping'] : null;
            if ($key === '' || $mapping === null || ! $request->exists($key)) {
                continue;
            }

            $selections[] = [
                'mapping' => [
                    'mappingTable' => (string) $mapping['mappingTable'],
                    'masterColumn' => (string) $mapping['masterColumn'],
                    'tagColumn' => (string) $mapping['tagColumn'],
                    'tagsTable' => (string) $mapping['tagsTable'],
                    'tagNameColumn' => (string) $mapping['tagNameColumn'],
                ],
                'ids' => $this->tagIds($request->input($key)),
            ];
        }

        return $selections;
    }

    /**
     * @param  list<array{mapping: array<string, string>, ids: list<int>}>  $selections
     */
    private function syncTags(int $masterId, User $user, array $selections): void
    {
        foreach ($selections as $selection) {
            $map = $selection['mapping'];
            if (
                ! $this->isSafeTable($map['mappingTable'])
                || ! $this->isSafeTable($map['tagsTable'])
                || ! $this->isSafeColumn($map['masterColumn'])
                || ! $this->isSafeColumn($map['tagColumn'])
                || ! Schema::hasTable($map['mappingTable'])
                || ! Schema::hasTable($map['tagsTable'])
            ) {
                continue;
            }

            $desired = $selection['ids'];
            $current = DB::table($map['mappingTable'])
                ->where($map['masterColumn'], $masterId)
                ->pluck($map['tagColumn'])
                ->map(static fn ($id): int => (int) $id)
                ->all();

            $toDelete = array_values(array_diff($current, $desired));
            $toInsert = array_values(array_diff($desired, $current));

            if ($toDelete !== []) {
                DB::table($map['mappingTable'])
                    ->where($map['masterColumn'], $masterId)
                    ->whereIn($map['tagColumn'], $toDelete)
                    ->delete();
            }

            foreach ($toInsert as $tagId) {
                if (! DB::table($map['tagsTable'])->where('ID', $tagId)->exists()) {
                    continue;
                }

                $row = [
                    $map['masterColumn'] => $masterId,
                    $map['tagColumn'] => $tagId,
                ];
                if (Schema::hasColumn($map['mappingTable'], 'mod_by')) {
                    $row['mod_by'] = $user->ID;
                }
                if (Schema::hasColumn($map['mappingTable'], 'mod_date')) {
                    $row['mod_date'] = now();
                }

                DB::table($map['mappingTable'])->insert($row);
            }
        }
    }

    /**
     * @return list<int>
     */
    private function tagIds(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $ids = [];
        foreach ($value as $item) {
            if (is_numeric($item)) {
                $ids[] = (int) $item;
                continue;
            }
            if (is_array($item)) {
                $id = $item['id'] ?? $item['ID'] ?? null;
                if (is_numeric($id)) {
                    $ids[] = (int) $id;
                }
            }
        }

        return array_values(array_unique(array_filter($ids, static fn (int $id): bool => $id > 0)));
    }

    /**
     * @param  array<string, string>  $mapping
     * @return list<array{id: int, label: string}>
     */
    private function tagLookupOptions(array $mapping): array
    {
        $table = $mapping['tagsTable'];
        $labelColumn = $mapping['tagNameColumn'];
        if (! $this->isSafeTable($table) || ! Schema::hasTable($table) || ! Schema::hasColumn($table, $labelColumn)) {
            return [];
        }

        return DB::table($table)
            ->select(['ID', $labelColumn])
            ->orderBy($labelColumn)
            ->limit(2000)
            ->get()
            ->map(function (object $row) use ($labelColumn): array {
                $label = trim((string) ($row->{$labelColumn} ?? ''));

                return [
                    'id' => (int) $row->ID,
                    'label' => $label !== '' ? $label : '#'.$row->ID,
                ];
            })
            ->all();
    }

    /**
     * @param  list<TableViewRecord>  $records
     * @param  list<array<string, mixed>>  $columns
     * @return array<string, array<int, list<array{id: int, name: string}>>>
     */
    private function loadTagValues(array $records, array $columns): array
    {
        $ids = [];
        foreach ($records as $record) {
            $value = $record->getAttribute('ID');
            if (is_numeric($value)) {
                $ids[(int) $value] = (int) $value;
            }
        }

        $loaded = [];
        if ($ids === []) {
            return $loaded;
        }

        foreach ($columns as $column) {
            if (! is_array($column) || ($column['kind'] ?? null) !== 'tags') {
                continue;
            }

            $key = (string) ($column['key'] ?? '');
            $mapping = is_array($column['tag_mapping'] ?? null) ? $column['tag_mapping'] : null;
            if ($key === '' || $mapping === null) {
                continue;
            }

            $loaded[$key] = [];
            if (
                ! $this->isSafeTable((string) $mapping['mappingTable'])
                || ! $this->isSafeTable((string) $mapping['tagsTable'])
                || ! Schema::hasTable((string) $mapping['mappingTable'])
                || ! Schema::hasTable((string) $mapping['tagsTable'])
            ) {
                continue;
            }

            $nameColumn = (string) $mapping['tagNameColumn'];
            $rows = DB::table($mapping['mappingTable'].' as map')
                ->leftJoin($mapping['tagsTable'].' as tag', 'tag.ID', '=', 'map.'.$mapping['tagColumn'])
                ->whereIn('map.'.$mapping['masterColumn'], array_values($ids))
                ->orderBy('tag.'.$nameColumn)
                ->get([
                    'map.'.$mapping['masterColumn'].' as master_id',
                    'tag.ID as id',
                    'tag.'.$nameColumn.' as name',
                ]);

            foreach ($rows as $row) {
                $masterId = (int) $row->master_id;
                $tagId = (int) $row->id;
                if ($tagId <= 0) {
                    continue;
                }
                $loaded[$key][$masterId][] = [
                    'id' => $tagId,
                    'name' => trim((string) ($row->name ?? '')) !== '' ? trim((string) $row->name) : '#'.$tagId,
                ];
            }
        }

        return $loaded;
    }

    private function tagNamesText(mixed $value): string
    {
        if (! is_array($value)) {
            return is_scalar($value) ? (string) $value : '';
        }

        $names = [];
        foreach ($value as $item) {
            if (is_array($item)) {
                $name = trim((string) ($item['name'] ?? $item['label'] ?? ''));
                if ($name !== '') {
                    $names[] = $name;
                }
            } elseif (is_scalar($item) && (string) $item !== '') {
                $names[] = (string) $item;
            }
        }

        return implode("\n", $names);
    }
}
