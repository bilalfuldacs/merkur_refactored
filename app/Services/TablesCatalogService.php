<?php

namespace App\Services;

use App\Models\ConfigTable;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class TablesCatalogService
{
    /**
     * @return array{groups: list<array{title: string, tables: list<array<string, mixed>>}>}
     */
    public function payload(User $user): array
    {
        $canEditItems = $user->canCreateUpdateItems();
        $canEditSystem = $user->isSuperuser();

        $rows = ConfigTable::query()
            ->whereNotNull('title')
            ->orderBy('ID')
            ->get();

        $groups = [];
        $currentTitle = '';
        $currentTables = [];
        $index = 0;

        foreach ($rows as $config) {
            $groupName = trim((string) $config->group);
            if ($groupName !== '') {
                if ($currentTables !== []) {
                    $groups[] = [
                        'title' => $currentTitle,
                        'tables' => $currentTables,
                    ];
                }
                $index++;
                $currentTitle = $index.' '.$groupName;
                $currentTables = [];
            }

            $isSystem = (bool) $config->system_table;
            $tableName = (string) $config->table;
            $faded = $tableName === 'test';

            $currentTables[] = [
                'id' => $config->ID,
                'table' => $tableName,
                'title' => $config->title ?: $config->item_name ?: $tableName,
                'description' => $this->plainDescription((string) $config->short_description),
                'color' => $config->color ?: '#E83181',
                'icon' => $config->icon,
                'item_count' => $this->itemCount($tableName),
                'has_history' => (bool) $config->has_history || Schema::hasTable($tableName.'_history'),
                'is_system' => $isSystem,
                'faded' => $faded,
                'can_edit' => $isSystem ? $canEditSystem : $canEditItems,
            ];
        }

        if ($currentTables !== []) {
            $groups[] = [
                'title' => $currentTitle,
                'tables' => $currentTables,
            ];
        }

        return ['groups' => $groups];
    }

    private function plainDescription(string $value): string
    {
        return html_entity_decode(strip_tags($value), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    private function itemCount(string $table): int
    {
        if (! $this->isSafeName($table) || ! Schema::hasTable($table)) {
            return 0;
        }

        try {
            return (int) DB::table($table)->count();
        } catch (Throwable) {
            return 0;
        }
    }

    private function isSafeName(string $name): bool
    {
        return (bool) preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $name);
    }
}
