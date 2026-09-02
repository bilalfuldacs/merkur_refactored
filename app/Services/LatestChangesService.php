<?php

namespace App\Services;

use App\Models\ConfigTable;
use App\Models\User;
use InvalidArgumentException;
use Throwable;

class LatestChangesService
{
    public const COUNTS = [5, 10, 25];

    public function __construct(private TableRowsService $rows) {}

    public function normalizeCount(int $count): int
    {
        return in_array($count, self::COUNTS, true) ? $count : 5;
    }

    /**
     * @return array{count: int, groups: list<array<string, mixed>>}
     */
    public function payload(User $user, int $count): array
    {
        $count = $this->normalizeCount($count);
        $configs = ConfigTable::query()->orderBy('ID')->get();

        $groups = [];
        $pending = null;
        $index = 1;

        foreach ($configs as $config) {
            if (filled($config->group)) {
                $pending = [
                    'index' => $index,
                    'name' => (string) $config->group,
                    'tables' => [],
                ];
                $index++;
            }

            if (! $config->change_report) {
                continue;
            }

            try {
                $section = $this->rows->recentModified((string) $config->table, $user, $count);
            } catch (InvalidArgumentException|Throwable) {
                continue;
            }

            if ($pending !== null) {
                $groups[] = $pending;
                $pending = null;
            } elseif ($groups === []) {
                $groups[] = [
                    'index' => null,
                    'name' => null,
                    'tables' => [],
                ];
            }

            $groups[array_key_last($groups)]['tables'][] = $section;
        }

        return [
            'count' => $count,
            'groups' => array_values(array_filter(
                $groups,
                fn (array $group): bool => $group['tables'] !== [],
            )),
        ];
    }
}
