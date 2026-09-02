<?php

namespace App\Services;

use App\Models\ConfigTable;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class GlobalSearchService
{
    private const TABLE_ALIASES = [
        'users' => 'dynamic__users',
        'statuses' => 'config__statuses',
    ];

    /**
     * @return array<string, mixed>
     */
    public function payload(User $user, string $query, int $limitPerCategory = 100): array
    {
        $started = microtime(true);
        $query = trim($query);
        if ($query === '' || mb_strlen($query) > 30) {
            return [
                'query' => $query,
                'total' => 0,
                'elapsed' => 0,
                'limit' => $limitPerCategory,
                'categories' => [],
            ];
        }

        $onlyId = preg_match('/\A#(\d+)\z/', $query, $matches) === 1 ? (int) $matches[1] : null;
        $like = '%'.addcslashes($onlyId === null ? $query : (string) $onlyId, '%_\\').'%';
        $categories = [];
        $total = 0;

        $configs = ConfigTable::query()
            ->where('in_global_search', true)
            ->whereNotNull('title')
            ->orderBy('ID')
            ->get();

        foreach ($configs as $config) {
            $category = $this->searchTable($user, $config, $query, $like, $onlyId, $limitPerCategory);
            if ($category === null || $category['items'] === []) {
                continue;
            }
            $total += $category['count'];
            $categories[] = $category;
        }

        return [
            'query' => $query,
            'total' => $total,
            'elapsed' => round(microtime(true) - $started, 2),
            'limit' => $limitPerCategory,
            'categories' => $categories,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function searchTable(
        User $user,
        ConfigTable $config,
        string $query,
        string $like,
        ?int $onlyId,
        int $limit,
    ): ?array {
        $logical = (string) $config->table;
        $source = $this->resolveTableName(
            is_string($config->view) && $config->view !== '' ? (string) $config->view : $logical,
        );
        if ($source === null) {
            return null;
        }

        $preview = array_values(array_filter(array_map(
            trim(...),
            explode(',', (string) $config->search_preview_columns),
        )));
        if ($preview === []) {
            $preview = ['ID'];
        }

        try {
            $schemaColumns = Schema::getColumns($source);
        } catch (Throwable) {
            return null;
        }

        $columns = [];
        foreach ($schemaColumns as $column) {
            $key = (string) $column['name'];
            $comment = (string) ($column['comment'] ?? '');
            $foreign = $this->foreignKey($comment);
            $related = $foreign !== null ? $this->resolveTableName($foreign['table']) : null;
            $columns[$key] = [
                'key' => $key,
                'foreign' => $foreign,
                'related' => $related,
                'display' => $foreign['column'] ?? null,
            ];
        }

        $builder = DB::table($source.' as t')->select('t.ID');
        $usedAliases = [];
        $joinIndex = 0;

        foreach ($columns as $meta) {
            $key = $meta['key'];
            if ($meta['related'] !== null && is_string($meta['display']) && Schema::hasColumn($meta['related'], $meta['display'])) {
                $joinIndex++;
                $alias = 'j'.$joinIndex;
                $usedAliases[$key] = $alias;
                $builder->leftJoin($meta['related'].' as '.$alias, $alias.'.ID', '=', 't.'.$key);
                $builder->addSelect($alias.'.'.$meta['display'].' as '.$key);
            } else {
                $builder->addSelect('t.'.$key);
            }
        }

        if (in_array($logical, ['markets_landbased', 'markets_online'], true) && ! $user->canAccessUnsubscribedMarkets()) {
            $stakeIds = $user->jurisdictionStakes()->pluck('jurisdiction_ID');
            if ($stakeIds->isEmpty()) {
                return null;
            }
            $builder->whereIn('t.jurisdiction_ID', $stakeIds);
        }

        if ($onlyId !== null) {
            $builder->where('t.ID', $onlyId);
        } else {
            $builder->where(function ($outer) use ($columns, $usedAliases, $like): void {
                foreach ($columns as $meta) {
                    $key = $meta['key'];
                    if (isset($usedAliases[$key])) {
                        $outer->orWhere($usedAliases[$key].'.'.$meta['display'], 'like', $like);
                    } else {
                        $outer->orWhere('t.'.$key, 'like', $like);
                    }
                }
            });
        }

        $builder->orderByDesc('t.ID')->limit($limit);

        try {
            $rows = $builder->get();
        } catch (Throwable) {
            return null;
        }

        if ($rows->isEmpty()) {
            return null;
        }

        $titleColumn = $preview[0];
        $detailColumns = array_slice($preview, 1);
        $format = is_string($config->search_preview_format) && $config->search_preview_format !== ''
            ? $config->search_preview_format
            : null;

        $items = [];
        foreach ($rows as $row) {
            $data = (array) $row;
            $title = trim((string) ($data[$titleColumn] ?? ''));
            if ($title === '') {
                $title = 'Item #'.($data['ID'] ?? '');
            }
            $details = [];
            foreach ($detailColumns as $column) {
                $value = $data[$column] ?? null;
                $details[] = $value === null || $value === '' ? 'NULL' : (string) $value;
            }
            $subtitle = $format !== null && $details !== []
                ? @vsprintf($format, $details)
                : implode(' · ', $details);
            if (! is_string($subtitle)) {
                $subtitle = implode(' · ', $details);
            }

            $items[] = [
                'id' => (int) $data['ID'],
                'title' => $title,
                'subtitle' => $subtitle !== '' ? $subtitle : null,
            ];
        }

        return [
            'table' => $logical,
            'title' => $config->title ?: $config->item_name ?: $logical,
            'color' => $config->color ?: '#E83181',
            'icon' => $config->icon,
            'count' => count($items),
            'capped' => count($items) === $limit,
            'query' => $query,
            'items' => $items,
        ];
    }

    /**
     * @return array{table: string, column: string}|null
     */
    private function foreignKey(string $comment): ?array
    {
        if (preg_match('/^@(@!?)?([A-Za-z_][A-Za-z0-9_]{0,39})\.([A-Za-z_][A-Za-z0-9_]{0,39})/', $comment, $matches) !== 1) {
            return null;
        }

        return [
            'table' => $matches[2],
            'column' => $matches[3],
        ];
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
}
