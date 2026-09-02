<?php

namespace App\Services;

use App\Models\FocusGroup;
use App\Models\StakeJurisdiction;
use App\Models\User;
use Illuminate\Support\Collection;

class FocusGroupsReportService
{
    /**
     * @return array<string, mixed>
     */
    public function payload(): array
    {
        $groups = FocusGroup::query()
            ->with(['version', 'jurisdiction', 'editor'])
            ->orderByDesc('ID')
            ->get();

        $byVersion = $groups->groupBy(fn (FocusGroup $group) => $group->version_ID ?: 0);
        $jurisdictionIds = $groups->pluck('jurisdiction_ID')->filter()->unique()->values();
        $stakeholders = StakeJurisdiction::query()
            ->with('person')
            ->whereIn('jurisdiction_ID', $jurisdictionIds)
            ->get()
            ->groupBy('jurisdiction_ID');

        $versions = [];
        foreach ($byVersion as $versionId => $items) {
            /** @var Collection<int, FocusGroup> $items */
            $first = $items->first();
            $version = $first?->version;
            $dates = $items->map(function (FocusGroup $group) {
                $value = $group->start_date;
                if ($value instanceof \DateTimeInterface) {
                    return $value->format('Y-m-d');
                }

                return is_string($value) && $value !== '' ? substr($value, 0, 10) : null;
            })->filter();
            $versions[] = [
                'version_ID' => $version?->ID,
                'version_name' => $version
                    ? trim((string) ($version->name_name2_COMBINED ?: trim($version->name.' '.($version->name2 ?? ''))))
                    : 'Unassigned',
                'first_date' => $dates->min() ?: null,
                'count' => $items->count(),
                'groups' => $items
                    ->sortBy(fn (FocusGroup $group) => $group->jurisdiction?->iso3166 ?? '')
                    ->map(function (FocusGroup $group) use ($stakeholders) {
                        $people = $stakeholders->get($group->jurisdiction_ID, collect())
                            ->map(fn (StakeJurisdiction $stake) => $this->person($stake->person))
                            ->filter()
                            ->values();

                        return [
                            'ID' => $group->ID,
                            'start_date' => $group->start_date instanceof \DateTimeInterface
                                ? $group->start_date->format('Y-m-d')
                                : (is_string($group->start_date) ? substr($group->start_date, 0, 10) : null),
                            'comment' => $group->test_comment,
                            'jurisdiction' => $group->jurisdiction ? [
                                'ID' => $group->jurisdiction->ID,
                                'name' => $group->jurisdiction->long_name_COMBINED
                                    ?: $group->jurisdiction->name_english
                                    ?: $group->jurisdiction->name,
                                'flag' => $group->jurisdiction->flag,
                                'iso3166' => $group->jurisdiction->iso3166,
                                'segment' => $group->jurisdiction->segment_name ?: $group->jurisdiction->segment,
                            ] : null,
                            'people' => $people,
                        ];
                    })
                    ->values(),
            ];
        }

        usort($versions, function (array $a, array $b): int {
            return strcmp((string) ($b['version_name'] ?? ''), (string) ($a['version_name'] ?? ''));
        });

        $latest = $groups->sortByDesc('mod_date')->first();

        return [
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'count' => $groups->count(),
            'versions' => $versions,
            'last_modified' => $latest ? [
                'at' => optional($latest->mod_date)?->format('Y-m-d H:i:s'),
                'editor' => $this->person($latest->editor),
                'jurisdiction' => $latest->jurisdiction?->name_english,
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function person(?User $user): ?array
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
}
