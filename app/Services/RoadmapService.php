<?php

namespace App\Services;

use App\Models\ConfigStatus;
use App\Models\Game;
use App\Models\GameMilestone;
use App\Models\Jurisdiction;
use App\Models\StakeJurisdiction;
use App\Models\User;
use App\Models\Version;
use App\Models\VersionMilestone;
use Illuminate\Support\Collection;

class RoadmapService
{
    public const RELEASED_STATUS_ID = 600;

    public const GAME_STATUS_IDS = [
        'req' => 200,
        'dev' => 300,
        'tri' => 400,
        'rel' => 600,
    ];

    public const PM_OWNER_ROLE_ID = 4;

    /**
     * @return array<string, mixed>
     */
    public function payload(string $view, ?User $user = null): array
    {
        return $view === 'games' ? $this->gamesPayload() : $this->versionsPayload($user);
    }

    /**
     * @return array<string, mixed>
     */
    private function versionsPayload(?User $user): array
    {
        $milestones = VersionMilestone::query()
            ->with(['version.platform', 'jurisdiction', 'expectedStatus'])
            ->whereHas('version', fn ($query) => $query->where('status_ID', '!=', 999))
            ->get();

        $grouped = $milestones->groupBy('version_ID');
        $rows = $grouped
            ->map(function (Collection $items) {
                /** @var VersionMilestone $first */
                $first = $items->first();
                $version = $first->version;
                if (! $version instanceof Version) {
                    return null;
                }

                return [
                    'ID' => $version->ID,
                    'name' => $version->name,
                    'name2' => $version->name2,
                    'subtitle' => $version->subtitle,
                    'sort' => $version->name_SORT ?? $version->name,
                    'platform' => $this->platformSummary($version->platform),
                    'milestones' => $items->map(fn (VersionMilestone $milestone) => $this->milestonePayload($milestone))->filter()->values(),
                ];
            })
            ->filter()
            ->sortBy('sort')
            ->values();

        return [
            'view' => 'versions',
            'can_show_development' => $user?->canUseTlpRed() === true,
            'jurisdiction_presets' => $this->jurisdictionPresets(),
            'rows' => $rows,
            'games' => [],
            'game_status_labels' => [],
            'jurisdictions' => $this->uniqueLookups($milestones, 'jurisdiction'),
            'platforms' => $this->uniquePlatforms($rows),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function gamesPayload(): array
    {
        $games = Game::query()
            ->with([
                'concept.studio.primaryContact',
                'concept.primaryDesignTargetMarket',
                'platform',
                'resolution',
                'versionFrom',
                'milestones',
            ])
            ->where('in_roadmap_g', true)
            ->orderBy('ID')
            ->get();

        $pmOwners = $this->pmOwnersByMarket(
            $games->map(fn (Game $game) => $game->concept?->pry_design_target_mkt)->filter()->unique()->all()
        );

        $rows = $games->map(function (Game $game) use ($pmOwners) {
            $concept = $game->concept;
            $market = $concept?->primaryDesignTargetMarket;
            $marketId = $concept?->pry_design_target_mkt;
            $milestones = $game->milestones->keyBy('expected_status_ID');

            return [
                'ID' => $game->ID,
                'name' => trim((string) ($concept?->name ?? '')) ?: ('Game #'.$game->ID),
                'code' => $game->ID_text,
                'studio' => $concept?->studio?->name,
                'studio_owner' => $this->personSummary($concept?->studio?->primaryContact),
                'pm_owners' => $marketId ? ($pmOwners[(int) $marketId] ?? []) : [],
                'target_market' => $market === null ? null : [
                    'ID' => $market->ID,
                    'name' => $market->name,
                    'iso3166' => $market->iso3166,
                    'color' => $market->color,
                ],
                'portfolio_strategy' => $concept?->portfolio_strategy,
                'platform' => $this->platformSummary($game->platform),
                'resolution' => $game->resolution?->name,
                'version_from' => $game->versionFrom?->name_name2_COMBINED ?? $game->versionFrom?->name,
                'supports_signage' => $game->supports_signage,
                'details' => [
                    'base_game_USP' => $concept?->base_game_USP,
                    'feature_game_USP' => $concept?->feature_game_USP,
                    'IP_licensed' => $concept?->IP_licensed,
                    'trademarks' => [
                        ['region' => 'EU', 'value' => $concept?->trademarked_EU],
                        ['region' => 'UK', 'value' => $concept?->trademarked_UK],
                        ['region' => 'US', 'value' => $concept?->trademarked_US],
                        ['region' => 'CA', 'value' => $concept?->trademarked_CA],
                        ['region' => 'AU-NZ', 'value' => $concept?->getAttribute('trademarked_AU-NZ')],
                    ],
                    'theme' => $concept?->theme,
                    'reels' => $game->reels,
                    'progressive_type' => $game->progressive_type,
                    'cash_on_reels' => $game->cash_on_reels,
                    'hold_and_spin' => $game->hold_and_spin,
                    'feature_in_feature' => $game->feature_in_feature,
                    'num_PP_pots' => $game->num_PP_pots,
                    'true_persistence' => $game->true_persistence,
                    'estimated_effort' => $game->estimated_effort,
                ],
                'statuses' => [
                    'req' => $this->gameStatusPayload($milestones->get(self::GAME_STATUS_IDS['req'])),
                    'dev' => $this->gameStatusPayload($milestones->get(self::GAME_STATUS_IDS['dev'])),
                    'tri' => $this->gameStatusPayload($milestones->get(self::GAME_STATUS_IDS['tri'])),
                    'rel' => $this->gameStatusPayload($milestones->get(self::GAME_STATUS_IDS['rel'])),
                ],
            ];
        })->values();

        return [
            'view' => 'games',
            'can_show_development' => false,
            'jurisdiction_presets' => [],
            'rows' => [],
            'games' => $rows,
            'game_status_labels' => $this->gameStatusLabels(),
            'jurisdictions' => [],
            'platforms' => $this->uniquePlatforms($rows),
        ];
    }

    /**
     * @return list<array{key: string, label: string, ids: list<int>}>
     */
    private function jurisdictionPresets(): array
    {
        $gli = $this->jurisdictionId(['(GLI)', 'GLI'], 26);
        $nonGli = $this->jurisdictionId(['(non-GLI)', '(nGLI)', 'non-GLI'], 27);
        $universal = $this->jurisdictionId(['(uni)'], 1);
        $defaultIds = $gli === null && $nonGli === null
            ? []
            : array_values(array_filter([$gli, $nonGli, $universal]));

        return [
            ['key' => 'default', 'label' => 'Default (GLI, non-GLI, universal)', 'ids' => $defaultIds],
            ['key' => 'gli', 'label' => '(GLI)', 'ids' => array_values(array_filter([$gli]))],
            ['key' => 'nongli', 'label' => '(non-GLI)', 'ids' => array_values(array_filter([$nonGli]))],
            ['key' => 'specific', 'label' => 'specific jurisdictions', 'ids' => $defaultIds],
        ];
    }

    /**
     * @param  list<string>  $codes
     */
    private function jurisdictionId(array $codes, int $fallbackId): ?int
    {
        $found = Jurisdiction::query()
            ->where(function ($query) use ($codes) {
                $query->whereIn('iso3166', $codes)->orWhereIn('name', $codes);
            })
            ->orderBy('ID')
            ->value('ID');

        if ($found) {
            return (int) $found;
        }

        if (Jurisdiction::query()->where('ID', $fallbackId)->exists()) {
            return $fallbackId;
        }

        return null;
    }

    /**
     * @param  list<int|string|null>  $marketIds
     * @return array<int, list<array<string, mixed>>>
     */
    private function pmOwnersByMarket(array $marketIds): array
    {
        $ids = array_values(array_unique(array_map('intval', array_filter($marketIds))));
        if ($ids === []) {
            return [];
        }

        return StakeJurisdiction::query()
            ->with('person')
            ->whereIn('jurisdiction_ID', $ids)
            ->whereHas('person', fn ($query) => $query->where('role_ID', self::PM_OWNER_ROLE_ID))
            ->get()
            ->groupBy('jurisdiction_ID')
            ->map(function (Collection $stakes) {
                return $stakes
                    ->map(fn (StakeJurisdiction $stake) => $this->personSummary($stake->person))
                    ->filter()
                    ->unique('ID')
                    ->values()
                    ->all();
            })
            ->all();
    }

    /**
     * @return array<string, mixed>|null
     */
    private function personSummary(?User $user): ?array
    {
        if (! $user instanceof User) {
            return null;
        }

        return [
            'ID' => $user->ID,
            'initials' => $user->initials,
            'firstname' => $user->firstname,
            'lastname' => $user->lastname,
            'bcolor' => $user->bcolor,
            'color' => $user->color,
            'role_ID' => $user->role_ID,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function gameStatusPayload(?GameMilestone $milestone): ?array
    {
        if (! $milestone instanceof GameMilestone) {
            return null;
        }

        $expectedRaw = $milestone->getRawOriginal('expected_date');
        $actualRaw = $milestone->getRawOriginal('actual_date');
        $sortRaw = $milestone->getRawOriginal('sort_date') ?? $actualRaw ?? $expectedRaw;
        $expectedParts = $this->dateParts($expectedRaw);
        $sortParts = $this->dateParts($sortRaw);

        return [
            'expected_label' => $this->rawDateLabel($expectedRaw),
            'actual_label' => $this->rawDateLabel($actualRaw),
            'expected_month' => $expectedParts === null ? null : sprintf('%04d-%02d', $expectedParts['year'], $expectedParts['month']),
            'sort_month' => $sortParts === null ? null : sprintf('%04d-%02d', $sortParts['year'], $sortParts['month']),
            'done' => $this->dateParts($actualRaw) !== null,
        ];
    }

    /**
     * @return array<string, string>
     */
    private function gameStatusLabels(): array
    {
        $names = ConfigStatus::query()
            ->whereIn('ID', array_values(self::GAME_STATUS_IDS))
            ->get()
            ->keyBy('ID');

        return [
            'req' => (string) ($names[self::GAME_STATUS_IDS['req']]->name ?? 'requested'),
            'dev' => (string) ($names[self::GAME_STATUS_IDS['dev']]->name ?? 'in R&D'),
            'tri' => (string) ($names[self::GAME_STATUS_IDS['tri']]->name ?? 'in field trial'),
            'rel' => (string) ($names[self::GAME_STATUS_IDS['rel']]->name ?? 'released'),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function milestonePayload(VersionMilestone $milestone): ?array
    {
        $parts = $this->modelDate($milestone, 'actual_date') ?? $this->modelDate($milestone, 'expected_date');
        if ($parts === null) {
            return null;
        }

        $statusId = (int) $milestone->expected_status_ID;
        $done = $this->modelDate($milestone, 'actual_date') !== null;

        return [
            'ID' => $milestone->ID,
            'month_key' => sprintf('%04d-%02d', $parts['year'], $parts['month']),
            'date_label' => $this->dateLabel($parts),
            'done' => $done,
            'kind' => $statusId === self::RELEASED_STATUS_ID ? ($done ? 'released' : 'planned') : 'development',
            'comment' => $milestone->comment,
            'status' => $milestone->expectedStatus === null ? null : [
                'ID' => $milestone->expectedStatus->ID,
                'name' => $milestone->expectedStatus->name,
                'color' => $milestone->expectedStatus->color,
            ],
            'jurisdiction' => $milestone->jurisdiction === null ? null : [
                'ID' => $milestone->jurisdiction->ID,
                'name' => $milestone->jurisdiction->name,
                'iso3166' => $milestone->jurisdiction->iso3166,
            ],
        ];
    }

    /**
     * @return array{year: int, month: int, day: int|null}|null
     */
    private function modelDate(object $model, string $column): ?array
    {
        if (! method_exists($model, 'getRawOriginal')) {
            return $this->dateParts($model->{$column} ?? null);
        }

        return $this->dateParts($model->getRawOriginal($column));
    }

    /**
     * @return array{year: int, month: int, day: int|null}|null
     */
    private function dateParts(mixed $value): ?array
    {
        if ($value === null || $value === '') {
            return null;
        }

        $raw = is_string($value) ? $value : (string) $value;
        if (! preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $raw, $match)) {
            return null;
        }

        $year = (int) $match[1];
        $month = (int) $match[2];
        $day = (int) $match[3];
        if ($year < 1990 || $month < 1 || $month > 12) {
            return null;
        }

        return [
            'year' => $year,
            'month' => $month,
            'day' => ($day >= 1 && $day <= 31) ? $day : null,
        ];
    }

    private function rawDateLabel(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $raw = is_string($value) ? $value : (string) $value;
        if (preg_match('/^(\d{4})-00-00/', $raw, $match)) {
            return $match[1];
        }
        if (preg_match('/^(\d{4})-(\d{2})-00/', $raw, $match)) {
            return $match[1].'-'.$match[2];
        }
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $raw, $match) && (int) $match[2] >= 1) {
            $parts = $this->dateParts($raw);

            return $parts === null ? $match[0] : $this->dateLabel($parts);
        }

        return null;
    }

    /**
     * @param  array{year: int, month: int, day: int|null}  $parts
     */
    private function dateLabel(array $parts): string
    {
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $month = $months[$parts['month'] - 1] ?? (string) $parts['month'];

        return $parts['day'] ? $parts['day'].' '.$month : $month;
    }

    /**
     * @param  Collection<int, VersionMilestone>  $milestones
     * @return list<array{ID: int, name: string|null, iso3166: string|null}>
     */
    private function uniqueLookups(Collection $milestones, string $relation): array
    {
        return $milestones
            ->pluck($relation)
            ->filter()
            ->unique('ID')
            ->sortBy('name')
            ->map(fn ($item) => [
                'ID' => $item->ID,
                'name' => $item->name,
                'iso3166' => $item->iso3166 ?? null,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     * @return list<array{ID: int, name: string|null, color: string|null}>
     */
    private function uniquePlatforms(Collection $rows): array
    {
        return $rows
            ->pluck('platform')
            ->filter()
            ->unique('ID')
            ->sortBy('name')
            ->values()
            ->all();
    }

    /**
     * @return array{ID: int, name: string|null, color: string|null, tint_roadmap: bool}|null
     */
    private function platformSummary($platform): ?array
    {
        if ($platform === null) {
            return null;
        }

        return [
            'ID' => $platform->ID,
            'name' => $platform->name,
            'color' => $platform->color,
            'tint_roadmap' => (bool) $platform->tint_roadmap,
        ];
    }
}
