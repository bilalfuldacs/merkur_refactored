<?php

namespace App\Services;

use App\Models\User;
use App\Models\Version;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class InstallationReportService
{
    private const PERF_KEYS = [
        1 => 'a_plus',
        2 => 'a',
        3 => 'b',
        4 => 'c',
        5 => 'd',
        6 => 'd_minus',
    ];

    private const PERF_LABELS = [
        1 => 'A+',
        2 => 'A',
        3 => 'B',
        4 => 'C',
        5 => 'D',
        6 => 'D-',
    ];

    /**
     * @return array<string, mixed>
     */
    public function payload(User $user, ?int $versionId): array
    {
        $versions = $this->versions();
        $featured = array_reverse(array_values(array_filter($versions, fn (array $version): bool => $version['featured'])));
        $selected = $this->resolveVersion($versions, $featured, $versionId);

        $base = [
            'generated_at' => now()->toDateTimeString(),
            'can_edit' => $user->canCreateUpdateItems(),
            'version' => $selected,
            'versions' => $versions,
            'featured' => $featured,
            'totals' => $this->emptyTotals(),
            'ratings' => $this->emptyRatings(),
            'last_install' => null,
            'last_availability' => null,
            'jurisdictions' => [],
            'availability' => [
                'available' => [],
                'intent' => [],
                'no_intent' => [],
            ],
        ];

        if ($selected === null) {
            return $base;
        }

        return array_merge($base, $this->versionPayload((int) $selected['ID']), [
            'version' => $selected,
            'versions' => $versions,
            'featured' => $featured,
        ]);
    }

    /**
     * @param  list<array<string, mixed>>  $versions
     * @param  list<array<string, mixed>>  $featured
     * @return array<string, mixed>|null
     */
    private function resolveVersion(array $versions, array $featured, ?int $versionId): ?array
    {
        if ($versions === []) {
            return null;
        }

        if ($versionId !== null) {
            foreach ($versions as $version) {
                if ((int) $version['ID'] === $versionId) {
                    return $version;
                }
            }
        }

        return $featured[0] ?? $versions[0];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function versions(): array
    {
        if (! Schema::hasTable('versions')) {
            return [];
        }

        $query = Version::query()->orderByDesc('name_SORT');
        $columns = array_values(array_filter(
            ['ID', 'name', 'name2', 'name_name2_COMBINED', 'feat_in_instl_feedback', 'name_SORT'],
            fn (string $column): bool => Schema::hasColumn('versions', $column),
        ));

        return $query->get($columns)->map(function (Version $version): array {
            $label = trim((string) ($version->name_name2_COMBINED ?: trim($version->name.' '.($version->name2 ?? ''))));

            return [
                'ID' => $version->ID,
                'name' => $version->name,
                'name2' => $version->name2,
                'label' => $label !== '' ? $label : 'Version #'.$version->ID,
                'featured' => (bool) $version->feat_in_instl_feedback,
            ];
        })->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function versionPayload(int $versionId): array
    {
        $rows = DB::table('installations as i')
            ->leftJoin('jurisdictions as j', 'j.ID', '=', 'i.jurisdiction_ID')
            ->leftJoin('venues as v', 'v.ID', '=', 'i.venue_ID')
            ->where('i.version_ID', $versionId)
            ->orderBy('j.iso3166')
            ->orderBy('v.name')
            ->get([
                'i.ID',
                'i.jurisdiction_ID',
                'i.venue_ID',
                'i.first_install_date',
                'i.live',
                'i.test',
                'i.planned',
                'i.perf_rating',
                'i.tech_rating',
                'i.test_comment',
                'i.rtp',
                'i.first_install_type',
                'j.long_name_COMBINED as jurisdiction_name',
                'j.name_english',
                'j.iso3166',
                'j.segment_name',
                'j.flag',
                'j.short_name_COMBINED',
                'v.name as venue_name',
            ]);

        $grouped = [];
        $totals = $this->emptyTotals();
        $ratings = $this->emptyRatings();

        foreach ($rows as $row) {
            $jurisdictionId = (int) $row->jurisdiction_ID;
            $grouped[$jurisdictionId] ??= [
                'ID' => $jurisdictionId,
                'name' => (string) ($row->name_english ?: $row->jurisdiction_name ?: 'Jurisdiction #'.$jurisdictionId),
                'name_english' => $row->name_english,
                'iso3166' => $row->iso3166,
                'segment_name' => $row->segment_name,
                'flag' => $row->flag,
                'short_name' => $row->iso3166 ?: $row->short_name_COMBINED,
                'first_installed' => null,
                'live' => 0,
                'test' => 0,
                'planned' => 0,
                'records' => 0,
                'ratings' => $this->emptyRatings(),
                'tech' => ['red' => 0, 'yellow' => 0, 'green' => 0, 'reports' => 0],
                'sites' => [],
            ];

            $live = (int) ($row->live ?? 0);
            $test = (int) ($row->test ?? 0);
            $planned = (int) ($row->planned ?? 0);
            $perf = is_numeric($row->perf_rating) ? (int) $row->perf_rating : null;

            $grouped[$jurisdictionId]['live'] += $live;
            $grouped[$jurisdictionId]['test'] += $test;
            $grouped[$jurisdictionId]['planned'] += $planned;
            $grouped[$jurisdictionId]['records']++;
            $totals['live'] += $live;
            $totals['test'] += $test;
            $totals['planned'] += $planned;
            $totals['records']++;

            if ($row->first_install_date) {
                $current = $grouped[$jurisdictionId]['first_installed'];
                if ($current === null || (string) $row->first_install_date < (string) $current) {
                    $grouped[$jurisdictionId]['first_installed'] = (string) $row->first_install_date;
                }
            }

            if ($perf !== null && isset(self::PERF_KEYS[$perf])) {
                $key = self::PERF_KEYS[$perf];
                $grouped[$jurisdictionId]['ratings'][$key]++;
                $ratings[$key]++;
                $totals['rated']++;
            }

            $tech = (string) ($row->tech_rating ?? '');
            if (in_array($tech, ['red', 'yellow', 'green'], true)) {
                $grouped[$jurisdictionId]['tech'][$tech]++;
                $grouped[$jurisdictionId]['tech']['reports']++;
            }

            $grouped[$jurisdictionId]['sites'][] = [
                'ID' => (int) $row->ID,
                'venue' => $row->venue_name ?: 'Venue',
                'venue_ID' => $row->venue_ID ? (int) $row->venue_ID : null,
                'date' => $row->first_install_date ? (string) $row->first_install_date : null,
                'live' => $live,
                'test' => $test,
                'planned' => $planned,
                'perf_rating' => $perf,
                'perf_label' => $perf !== null ? (self::PERF_LABELS[$perf] ?? null) : null,
                'tech_rating' => $tech !== '' ? $tech : null,
                'comment' => $row->test_comment,
                'rtp' => $row->rtp,
                'first_install_type' => $row->first_install_type,
            ];
        }

        $totals['footprint'] = $totals['live'] + $totals['test'] + $totals['planned'];
        $totals['unrated'] = max(0, $totals['records'] - $totals['rated']);

        $people = $this->peopleFor(array_keys($grouped));
        $jurisdictions = [];
        foreach ($grouped as $jurisdictionId => $item) {
            $item['performance'] = $this->performanceBadge($item['ratings']);
            $item['people'] = $people[$jurisdictionId] ?? [];
            $jurisdictions[] = $item;
        }

        return [
            'totals' => $totals,
            'ratings' => $ratings,
            'last_install' => $this->lastChange('installations', $versionId),
            'last_availability' => $this->lastChange('availabilities', $versionId),
            'jurisdictions' => $jurisdictions,
            'availability' => $this->availability($versionId),
        ];
    }

    /**
     * @param  array<string, int>  $ratings
     */
    private function performanceBadge(array $ratings): ?string
    {
        $present = [];
        foreach (self::PERF_LABELS as $value => $label) {
            $key = self::PERF_KEYS[$value];
            if (($ratings[$key] ?? 0) > 0) {
                $present[] = $label;
            }
        }

        if ($present === []) {
            return null;
        }

        return count($present) === 1 ? $present[0] : 'mixed';
    }

    /**
     * @param  list<int|string>  $jurisdictionIds
     * @return array<int, list<array<string, mixed>>>
     */
    private function peopleFor(array $jurisdictionIds): array
    {
        $ids = array_values(array_filter(array_map('intval', $jurisdictionIds)));
        if ($ids === [] || ! Schema::hasTable('stakes_jurisdictions') || ! Schema::hasTable('dynamic__users')) {
            return [];
        }

        $people = [];
        DB::table('stakes_jurisdictions as s')
            ->join('dynamic__users as u', 'u.ID', '=', 's.person_ID')
            ->whereIn('s.jurisdiction_ID', $ids)
            ->orderByDesc('u.role_ID')
            ->orderBy('u.initials')
            ->get([
                's.jurisdiction_ID',
                'u.ID',
                'u.firstname',
                'u.lastname',
                'u.initials',
                'u.bcolor',
                'u.color',
                'u.role_ID',
            ])
            ->each(function (object $row) use (&$people): void {
                $jurisdictionId = (int) $row->jurisdiction_ID;
                $personId = (int) $row->ID;
                $people[$jurisdictionId][$personId] ??= [
                    'ID' => $row->ID,
                    'firstname' => $row->firstname,
                    'lastname' => $row->lastname,
                    'initials' => $row->initials,
                    'bcolor' => $row->bcolor,
                    'color' => $row->color,
                    'role_ID' => $row->role_ID,
                ];
            });

        return array_map(array_values(...), $people);
    }

    /**
     * @return array{available: list<array<string, mixed>>, intent: list<array<string, mixed>>, no_intent: list<array<string, mixed>>}
     */
    private function availability(int $versionId): array
    {
        $groups = [
            'availability' => 'available',
            'intent' => 'intent',
            'no intent' => 'no_intent',
        ];
        $payload = ['available' => [], 'intent' => [], 'no_intent' => []];

        if (! Schema::hasTable('availabilities')) {
            return $payload;
        }

        DB::table('availabilities as a')
            ->leftJoin('jurisdictions as j', 'j.ID', '=', 'a.jurisdiction_ID')
            ->where('a.version_ID', $versionId)
            ->orderByRaw("CASE a.priority WHEN '‼️ high' THEN 1 WHEN 'standard' THEN 2 ELSE 3 END")
            ->orderBy('j.iso3166')
            ->get([
                'a.ID',
                'a.jurisdiction_ID',
                'a.status',
                'a.priority',
                'j.short_name_COMBINED',
                'j.name_english',
                'j.iso3166',
                'j.flag',
                'j.long_name_COMBINED',
            ])
            ->each(function (object $row) use (&$payload, $groups): void {
                $bucket = $groups[(string) $row->status] ?? null;
                if ($bucket === null) {
                    return;
                }

                $payload[$bucket][] = [
                    'ID' => (int) $row->ID,
                    'jurisdiction_ID' => (int) $row->jurisdiction_ID,
                    'code' => $row->short_name_COMBINED ?: $row->iso3166,
                    'name' => $row->name_english ?: $row->long_name_COMBINED,
                    'flag' => $row->flag,
                    'priority' => $row->priority,
                ];
            });

        return $payload;
    }

    /**
     * @return array{when: string|null, who: string|null, where: string|null}|null
     */
    private function lastChange(string $table, int $versionId): ?array
    {
        if (! Schema::hasTable($table)) {
            return null;
        }

        $row = DB::table($table)
            ->leftJoin('dynamic__users', 'dynamic__users.ID', '=', $table.'.mod_by')
            ->leftJoin('jurisdictions', 'jurisdictions.ID', '=', $table.'.jurisdiction_ID')
            ->where($table.'.version_ID', $versionId)
            ->orderByDesc($table.'.mod_date')
            ->select([
                $table.'.mod_date as modified_at',
                'dynamic__users.firstname',
                'dynamic__users.lastname',
                'jurisdictions.name_english',
            ])
            ->first();

        if ($row === null) {
            return null;
        }

        $who = trim(trim((string) ($row->firstname ?? '')).' '.trim((string) ($row->lastname ?? '')));

        return [
            'when' => $row->modified_at ? (string) $row->modified_at : null,
            'who' => $who !== '' ? $who : null,
            'where' => $row->name_english ? (string) $row->name_english : null,
        ];
    }

    /**
     * @return array{live: int, test: int, planned: int, footprint: int, records: int, rated: int, unrated: int}
     */
    private function emptyTotals(): array
    {
        return [
            'live' => 0,
            'test' => 0,
            'planned' => 0,
            'footprint' => 0,
            'records' => 0,
            'rated' => 0,
            'unrated' => 0,
        ];
    }

    /**
     * @return array{a_plus: int, a: int, b: int, c: int, d: int, d_minus: int}
     */
    private function emptyRatings(): array
    {
        return [
            'a_plus' => 0,
            'a' => 0,
            'b' => 0,
            'c' => 0,
            'd' => 0,
            'd_minus' => 0,
        ];
    }
}
