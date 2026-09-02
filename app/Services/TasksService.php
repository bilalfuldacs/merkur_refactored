<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class TasksService
{
    public const PEOPLE = ['m', 'e'];

    public const TIMES = ['u', 'd', 'a', 'f'];

    /**
     * @return array{people: string, time: string, versions: list<array<string, mixed>>, builds: list<array<string, mixed>>}
     */
    public function payload(User $user, string $people, string $time): array
    {
        $people = $this->normalizePeople($people);
        $time = $this->normalizeTime($time);

        return [
            'people' => $people,
            'time' => $time,
            'versions' => $this->versionTasks($user, $people, $time),
            'builds' => $this->buildTasks($user, $people, $time),
        ];
    }

    public function normalizePeople(string $people): string
    {
        return in_array($people, self::PEOPLE, true) ? $people : 'm';
    }

    public function normalizeTime(string $time): string
    {
        return in_array($time, self::TIMES, true) ? $time : 'a';
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function versionTasks(User $user, string $people, string $time): array
    {
        $query = DB::table('version_milestones as SV')
            ->leftJoin('versions as V', 'V.ID', '=', 'SV.version_ID')
            ->leftJoin('jurisdictions as J', 'J.ID', '=', 'SV.jurisdiction_ID')
            ->leftJoin('config__statuses as S', 'S.ID', '=', 'SV.expected_status_ID')
            ->leftJoin('stakes_jurisdictions as SJ', 'SJ.jurisdiction_ID', '=', 'SV.jurisdiction_ID')
            ->leftJoin('dynamic__users as U', 'U.ID', '=', 'SJ.person_ID')
            ->select([
                'SV.ID',
                'V.ID as subject_id',
                'V.name as subject_name',
                'J.ID as jurisdiction_id',
                'J.flag',
                'J.iso3166',
                'J.segment',
                'S.name as status_name',
                'S.color as status_color',
                'S.text_color as status_text_color',
                'SV.expected_date',
                'SV.actual_date',
                'SV.comment',
                'U.ID as person_id',
                'U.initials',
                'U.firstname',
                'U.lastname',
                'U.bcolor',
                'U.color',
                'U.role_ID as role_id',
                DB::raw('(SV.expected_date < NOW() AND SV.actual_date IS NULL) as due'),
            ])
            ->orderByDesc('due')
            ->orderByRaw('COALESCE(SV.actual_date, SV.expected_date) DESC')
            ->orderBy('SV.ID');

        $this->constrain($query, 'SJ.person_ID', 'SV.expected_date', 'SV.actual_date', $user, $people, $time);

        return $this->groupRows($query->get()->all(), 'versions');
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function buildTasks(User $user, string $people, string $time): array
    {
        $query = DB::table('build_milestones as SB')
            ->leftJoin('builds as B', 'B.ID', '=', 'SB.build_ID')
            ->leftJoin('jurisdictions as J', 'J.ID', '=', 'B.jurisdiction_ID')
            ->leftJoin('config__statuses as S', 'S.ID', '=', 'SB.expected_status_ID')
            ->leftJoin('stakes_jurisdictions as SJ', 'SJ.jurisdiction_ID', '=', 'B.jurisdiction_ID')
            ->leftJoin('dynamic__users as U', 'U.ID', '=', 'SJ.person_ID')
            ->select([
                'SB.ID',
                'B.ID as subject_id',
                'B.name as subject_name',
                'J.ID as jurisdiction_id',
                'J.flag',
                'J.iso3166',
                'J.segment',
                'S.name as status_name',
                'S.color as status_color',
                'S.text_color as status_text_color',
                'SB.expected_date',
                'SB.actual_date',
                'SB.comment',
                'U.ID as person_id',
                'U.initials',
                'U.firstname',
                'U.lastname',
                'U.bcolor',
                'U.color',
                'U.role_ID as role_id',
                DB::raw('(SB.expected_date < NOW() AND SB.actual_date IS NULL) as due'),
            ])
            ->orderByDesc('due')
            ->orderByRaw('COALESCE(SB.actual_date, SB.expected_date) DESC')
            ->orderBy('SB.ID');

        $this->constrain($query, 'SJ.person_ID', 'SB.expected_date', 'SB.actual_date', $user, $people, $time);

        return $this->groupRows($query->get()->all(), 'builds');
    }

    private function constrain(
        Builder $query,
        string $personColumn,
        string $expectedColumn,
        string $actualColumn,
        User $user,
        string $people,
        string $time,
    ): void {
        if ($people === 'm') {
            $query->where($personColumn, $user->ID);
        }

        match ($time) {
            'f' => $query->whereNotNull($actualColumn),
            'd' => $query->whereNull($actualColumn)->where($expectedColumn, '<', now()),
            'u' => $query->whereNull($actualColumn)->where($expectedColumn, '>=', now()),
            default => $query->whereNull($actualColumn),
        };
    }

    /**
     * @param  list<object>  $rows
     * @return list<array<string, mixed>>
     */
    private function groupRows(array $rows, string $subjectTable): array
    {
        $grouped = [];

        foreach ($rows as $row) {
            $id = (int) $row->ID;
            if (! isset($grouped[$id])) {
                $grouped[$id] = [
                    'ID' => $id,
                    'due' => (int) $row->due === 1,
                    'subject' => $row->subject_id === null ? null : [
                        'ID' => (int) $row->subject_id,
                        'name' => $row->subject_name,
                        'table' => $subjectTable,
                    ],
                    'jurisdiction' => $row->jurisdiction_id === null ? null : [
                        'ID' => (int) $row->jurisdiction_id,
                        'flag' => $row->flag,
                        'iso3166' => $row->iso3166,
                        'segment' => $row->segment,
                    ],
                    'status' => $row->status_name === null ? null : [
                        'name' => $row->status_name,
                        'color' => $row->status_color,
                        'text_color' => $row->status_text_color,
                    ],
                    'expected_date' => $this->dateString($row->expected_date),
                    'actual_date' => $this->dateString($row->actual_date),
                    'comment' => $row->comment,
                    'people' => [],
                ];
            }

            $personId = $row->person_id !== null ? (int) $row->person_id : 0;
            if ($personId > 0 && ! isset($grouped[$id]['people'][$personId])) {
                $grouped[$id]['people'][$personId] = [
                    'ID' => $personId,
                    'initials' => $row->initials,
                    'firstname' => $row->firstname,
                    'lastname' => $row->lastname,
                    'bcolor' => $row->bcolor,
                    'color' => $row->color,
                    'role_ID' => $row->role_id !== null ? (int) $row->role_id : null,
                ];
            }
        }

        return array_values(array_map(function (array $item): array {
            $item['people'] = array_values($item['people']);

            return $item;
        }, $grouped));
    }

    private function dateString(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $raw = is_string($value) ? $value : (string) $value;
        if (preg_match('/^\d{4}-\d{2}-\d{2}/', $raw, $match) === 1) {
            return substr($match[0], 0, 10);
        }

        return $raw;
    }
}
