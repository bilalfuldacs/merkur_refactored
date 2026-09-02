<?php

namespace App\Services;

use App\Models\Jurisdiction;
use App\Models\StakeJurisdiction;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class PeopleMarketsService
{
    /**
     * Role names mapped to the panorama avatar groups.
     * Names are used instead of IDs so dummy/seeded roles still land in the right strip.
     *
     * @var array<string, list<string>>
     */
    private const GROUP_ROLES = [
        'product_organization' => ['Superuser', 'Product Organization', 'Dummy Superuser', 'Dummy Editor'],
        'sales' => ['Sales (all Markets)', 'Sales', 'Dummy Sales'],
        'c_level' => ['C-Level Suite'],
        'global_game_design' => ['Global Game Design'],
        'game_design' => ['Game Design'],
        'development' => ['Development'],
        'other' => ['Read-Only User (all Markets)', 'Read-Only User', 'Dummy Viewer'],
    ];

    /**
     * @return array<string, mixed>
     */
    public function payload(?User $viewer): array
    {
        $people = User::query()
            ->with('role')
            ->where('active', true)
            ->orderBy('role_ID')
            ->orderBy('initials')
            ->get();

        $stakes = StakeJurisdiction::query()
            ->with([
                'person.role',
                'jurisdiction.landbasedMarket',
                'jurisdiction.onlineMarket',
            ])
            ->whereHas('jurisdiction', function ($query): void {
                $query->whereNull('parent_ID');
            })
            ->get();

        $primaries = $stakes->filter(fn (StakeJurisdiction $stake): bool => ! $stake->as_deputy);
        $deputies = $stakes->filter(fn (StakeJurisdiction $stake): bool => (bool) $stake->as_deputy);
        $canShowDeputies = $viewer?->canUseTlpRed() === true;

        return [
            'current_user_id' => $viewer?->ID,
            'can_show_deputies' => $canShowDeputies,
            'groups' => $this->groupPeople($people),
            'markets_to_people' => $this->marketsToPeople($primaries, $deputies, $canShowDeputies),
            'people_to_markets' => $this->peopleToMarkets($primaries),
            'unassigned_markets' => $this->unassignedMarkets($primaries),
        ];
    }

    /**
     * @param  Collection<int, User>  $people
     * @return array<string, list<array<string, mixed>>>
     */
    private function groupPeople(Collection $people): array
    {
        $grouped = [];
        foreach (array_keys(self::GROUP_ROLES) as $key) {
            $grouped[$key] = [];
        }

        foreach ($people as $person) {
            $grouped[$this->groupKeyFor($person)][] = $this->personPayload($person);
        }

        return $grouped;
    }

    private function groupKeyFor(User $person): string
    {
        $name = $person->role?->name ?? '';

        foreach (self::GROUP_ROLES as $key => $names) {
            if (in_array($name, $names, true)) {
                return $key;
            }
        }

        return 'other';
    }

    /**
     * @param  Collection<int, StakeJurisdiction>  $primaries
     * @param  Collection<int, StakeJurisdiction>  $deputies
     * @return list<array<string, mixed>>
     */
    private function marketsToPeople(Collection $primaries, Collection $deputies, bool $canShowDeputies): array
    {
        $deputyPeople = $deputies
            ->groupBy('jurisdiction_ID')
            ->map(function (Collection $rows): Collection {
                return $rows
                    ->map(fn (StakeJurisdiction $stake): ?User => $stake->person)
                    ->filter(fn ($person): bool => $person instanceof User)
                    ->unique('ID')
                    ->values();
            });

        $byMarket = $primaries
            ->groupBy('jurisdiction_ID')
            ->sortBy(function (Collection $rows): string {
                $jurisdiction = $rows->first()?->jurisdiction;

                return mb_strtolower((string) ($jurisdiction?->name_english ?? $jurisdiction?->name ?? ''));
            }, SORT_NATURAL);

        $rows = [];

        foreach ($byMarket as $jurisdictionId => $assignments) {
            $jurisdiction = $assignments->first()?->jurisdiction;
            if (! $jurisdiction instanceof Jurisdiction) {
                continue;
            }

            $people = $assignments
                ->map(fn (StakeJurisdiction $stake): ?User => $stake->person)
                ->filter(fn ($person): bool => $person instanceof User)
                ->unique('ID')
                ->sortBy([
                    fn (User $person): int => (int) $person->role_ID,
                    fn (User $person): string => mb_strtolower((string) $person->initials),
                ])
                ->reverse()
                ->values();

            $deputyList = $canShowDeputies
                ? ($deputyPeople->get($jurisdictionId) ?? collect())
                : collect();

            $rows[] = [
                ...$this->marketPayload($jurisdiction),
                'people' => $people->map(fn (User $person): array => $this->personPayload($person))->all(),
                'deputies' => $deputyList->map(fn (User $person): array => $this->personPayload($person))->all(),
            ];
        }

        return $rows;
    }

    /**
     * @param  Collection<int, StakeJurisdiction>  $primaries
     * @return list<array<string, mixed>>
     */
    private function peopleToMarkets(Collection $primaries): array
    {
        $byPerson = $primaries
            ->groupBy('person_ID')
            ->sortBy(function (Collection $rows): array {
                $person = $rows->first()?->person;

                return [
                    (int) ($person?->role_ID ?? 0),
                    mb_strtolower((string) ($person?->initials ?? '')),
                ];
            });

        $rows = [];

        foreach ($byPerson as $assignments) {
            $person = $assignments->first()?->person;
            if (! $person instanceof User) {
                continue;
            }

            $markets = $assignments
                ->map(fn (StakeJurisdiction $stake): ?Jurisdiction => $stake->jurisdiction)
                ->filter(fn ($jurisdiction): bool => $jurisdiction instanceof Jurisdiction)
                ->unique('ID')
                ->sortBy(fn (Jurisdiction $jurisdiction): string => mb_strtolower((string) ($jurisdiction->name_english ?? $jurisdiction->name ?? '')), SORT_NATURAL)
                ->values();

            $payloads = $markets->map(fn (Jurisdiction $jurisdiction): array => $this->marketPayload($jurisdiction));

            $rows[] = [
                'person' => $this->personPayload($person),
                'markets' => $payloads->all(),
                'landbased_count' => $payloads->where('segment', 'land-based')->count(),
                'online_count' => $payloads->where('segment', 'online')->count(),
            ];
        }

        return $rows;
    }

    /**
     * @param  Collection<int, StakeJurisdiction>  $primaries
     * @return list<array<string, mixed>>
     */
    private function unassignedMarkets(Collection $primaries): array
    {
        $assignedIds = $primaries
            ->pluck('jurisdiction_ID')
            ->filter()
            ->unique()
            ->all();

        return Jurisdiction::query()
            ->whereNull('parent_ID')
            ->when($assignedIds !== [], fn ($query) => $query->whereNotIn('ID', $assignedIds))
            ->orderBy('name_english')
            ->get()
            ->map(fn (Jurisdiction $jurisdiction): array => $this->marketPayload($jurisdiction))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function marketPayload(Jurisdiction $jurisdiction): array
    {
        $land = $jurisdiction->landbasedMarket;
        $online = $jurisdiction->onlineMarket;
        $updatedAt = $land?->mod_date ?? $online?->mod_date;

        return [
            'id' => $jurisdiction->ID,
            'name' => $jurisdiction->name,
            'name_english' => $jurisdiction->name_english,
            'flag' => $jurisdiction->flag,
            'segment' => $jurisdiction->segment,
            'cluster' => $land?->cluster ?? $online?->cluster,
            'market_updated_at' => $updatedAt instanceof Carbon ? $updatedAt->toDateString() : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function personPayload(User $person): array
    {
        $name = trim((string) ($person->name_COMBINED ?: trim(($person->firstname ?? '').' '.($person->lastname ?? '')) ?: $person->username));

        return [
            'ID' => $person->ID,
            'initials' => $person->initials,
            'firstname' => $person->firstname,
            'lastname' => $person->lastname,
            'name' => $name !== '' ? $name : $person->username,
            'jobtitle' => $person->jobtitle,
            'bcolor' => $person->bcolor,
            'color' => $person->color,
            'role_ID' => $person->role_ID,
            'role' => $person->role?->name,
        ];
    }
}
