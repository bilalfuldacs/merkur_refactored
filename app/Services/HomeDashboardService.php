<?php

namespace App\Services;

use App\Models\ConfigReport;
use App\Models\ConfigTable;
use App\Models\DynamicPost;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class HomeDashboardService
{
    private const CHANGE_LIMIT = 25;

    private const POST_LIMIT = 15;

    /**
     * @return array{changes: list<array<string, mixed>>, reports: list<array<string, mixed>>, tables: list<array<string, mixed>>, posts: list<array<string, mixed>>}
     */
    public function payload(): array
    {
        return [
            'changes' => $this->latestChanges()->all(),
            'reports' => $this->reports()->all(),
            'tables' => $this->tables()->all(),
            'posts' => $this->posts()->all(),
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function latestChanges(): Collection
    {
        $configs = ConfigTable::query()
            ->where('change_report', true)
            ->orderBy('ID')
            ->get();

        $collected = collect();

        foreach ($configs as $config) {
            $table = (string) $config->table;
            if (! $this->isSafeName($table) || ! Schema::hasTable($table) || ! Schema::hasColumn($table, 'ID') || ! Schema::hasColumn($table, 'mod_date')) {
                continue;
            }

            $preview = collect(explode(',', (string) $config->search_preview_columns))
                ->map(fn (string $column): string => trim($column))
                ->filter(fn (string $column): bool => $this->isSafeName($column) && Schema::hasColumn($table, $column))
                ->values();

            $titleColumn = $preview->first();
            $detailColumns = $preview->slice(1)->values();

            $query = DB::table($table.' as t');
            $select = [
                't.ID as item_id',
                't.mod_date as modified_at',
            ];

            if (is_string($titleColumn)) {
                $select[] = "t.{$titleColumn} as title";
            }

            if (Schema::hasColumn($table, 'mod_by')) {
                $query->leftJoin('dynamic__users as u', 'u.ID', '=', 't.mod_by');
                $select = array_merge($select, [
                    'u.ID as editor_id',
                    'u.firstname as editor_firstname',
                    'u.lastname as editor_lastname',
                    'u.initials as editor_initials',
                    'u.bcolor as editor_bcolor',
                    'u.color as editor_color',
                    'u.role_ID as editor_role_id',
                ]);
            }

            foreach ($detailColumns as $index => $column) {
                $select[] = "t.{$column} as detail_{$index}";
            }

            try {
                $rows = $query->select($select)
                    ->orderByDesc('t.mod_date')
                    ->limit(self::CHANGE_LIMIT)
                    ->get();
            } catch (Throwable) {
                continue;
            }

            foreach ($rows as $row) {
                $details = [];
                foreach ($detailColumns as $index => $column) {
                    $value = $row->{'detail_'.$index} ?? null;
                    if ($value !== null && $value !== '') {
                        $details[] = (string) $value;
                    }
                }

                $subtitle = null;
                if ($details !== []) {
                    $format = $config->search_preview_format;
                    $formatted = false;
                    if (is_string($format) && $format !== '') {
                        try {
                            $formatted = vsprintf($format, $details);
                        } catch (Throwable) {
                            $formatted = false;
                        }
                    }
                    $subtitle = strip_tags($formatted !== false ? $formatted : implode(' • ', $details));
                }

                $modifiedAt = $row->modified_at
                    ? Carbon::parse($row->modified_at)->toIso8601String()
                    : null;

                $collected->push([
                    'id' => $table.'-'.$row->item_id,
                    'table' => $table,
                    'table_title' => $config->title ?: $config->item_name,
                    'title' => trim((string) ($row->title ?? '')),
                    'subtitle' => $subtitle !== '' ? $subtitle : null,
                    'color' => $config->color,
                    'modified_at' => $modifiedAt,
                    'editor' => isset($row->editor_id) ? [
                        'ID' => $row->editor_id,
                        'firstname' => $row->editor_firstname,
                        'lastname' => $row->editor_lastname,
                        'initials' => $row->editor_initials,
                        'bcolor' => $row->editor_bcolor,
                        'color' => $row->editor_color,
                        'role_ID' => $row->editor_role_id,
                    ] : null,
                ]);
            }
        }

        return $collected
            ->sortByDesc('modified_at')
            ->take(self::CHANGE_LIMIT)
            ->values();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function reports(): Collection
    {
        return ConfigReport::query()
            ->where('in_launchpad', true)
            ->orderBy('ID')
            ->get(['ID', 'name', 'title', 'icon', 'color'])
            ->map(fn (ConfigReport $report): array => [
                'ID' => $report->ID,
                'name' => $report->name,
                'title' => $report->title ?: $report->name,
                'icon' => $report->icon,
                'color' => $report->color,
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function tables(): Collection
    {
        return ConfigTable::query()
            ->where('in_launchpad', true)
            ->orderBy('ID')
            ->get(['ID', 'group', 'table', 'title', 'item_name', 'color', 'icon'])
            ->map(fn (ConfigTable $table): array => [
                'ID' => $table->ID,
                'group' => $table->group,
                'table' => $table->table,
                'title' => $table->title ?: $table->item_name ?: $table->table,
                'color' => $table->color,
                'icon' => $table->icon,
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function posts(): Collection
    {
        return DynamicPost::query()
            ->whereNull('parent_ID')
            ->with('editor')
            ->orderByDesc('ID')
            ->limit(self::POST_LIMIT)
            ->get()
            ->map(function (DynamicPost $post): array {
                $editor = $post->editor;

                return [
                    'ID' => $post->ID,
                    'note' => $post->note,
                    'modified_at' => $post->mod_date?->toIso8601String(),
                    'num_likes' => $post->num_likes,
                    'num_comments' => $post->num_comments,
                    'editor' => $editor === null ? null : [
                        'ID' => $editor->ID,
                        'firstname' => $editor->firstname,
                        'lastname' => $editor->lastname,
                        'initials' => $editor->initials,
                        'bcolor' => $editor->bcolor,
                        'color' => $editor->color,
                        'role_ID' => $editor->role_ID,
                    ],
                ];
            });
    }

    private function isSafeName(string $name): bool
    {
        return (bool) preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $name);
    }
}
