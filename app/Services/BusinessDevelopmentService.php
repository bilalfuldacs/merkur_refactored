<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

class BusinessDevelopmentService
{
    public const STATUSES = [
        'merkur' => [
            'label' => 'MERKUR Markets',
            'summary' => 'Active MERKUR markets',
            'definition' => 'MERKUR is present with verifiable land-based gaming machine sales activity within the last 24 months.',
            'color' => '#009FE3',
        ],
        'open' => [
            'label' => 'Open Markets',
            'summary' => 'Regulated and licensable',
            'definition' => 'Land-based machine gaming is legalised and licensable, with a clear regulatory path.',
            'color' => '#A2C617',
        ],
        'watch' => [
            'label' => 'Markets to Watch',
            'summary' => 'Not yet legalised',
            'definition' => 'Not yet legalised, but monitored for policy movement, economic drivers or demand indicators.',
            'color' => '#F07E26',
        ],
        'nogo' => [
            'label' => 'No-Go Markets',
            'summary' => 'Entry is out of scope',
            'definition' => 'No active market entry due to political, societal, economic or religious constraints.',
            'color' => '#EB0000',
        ],
    ];

    public const PRESENCE = [
        'present' => 'Present',
        'limited' => 'Limited',
        'planned' => 'Planned',
        'absent' => 'Not present',
    ];

    private const PRESENCE_RANK = [
        'present' => 4,
        'limited' => 3,
        'planned' => 2,
        'absent' => 1,
    ];

    private const PLACE_TO_SEGMENT = [
        'casino' => 'Casinos',
        'casinos' => 'Casinos',
        'cas' => 'Casinos',
        'arcade' => 'Street / Arcades / Halls',
        'arcades' => 'Street / Arcades / Halls',
        'arc' => 'Street / Arcades / Halls',
        'spielhalle' => 'Street / Arcades / Halls',
        'pub' => 'HoReCa / Bar',
        'pubs' => 'HoReCa / Bar',
        'horeca' => 'HoReCa / Bar',
        'gastro' => 'HoReCa / Bar',
        'bar' => 'HoReCa / Bar',
        'lpm' => 'HoReCa / Bar',
        'b1' => 'HoReCa / Bar',
    ];

    private const COUNTRY_ALIASES = [
        'bih' => 'Bosnia and Herzegovina',
        'luxemburg' => 'Luxembourg',
        'united states of america' => 'United States',
        'usa' => 'United States',
        'uk' => 'United Kingdom',
        'czechia' => 'Czech Republic',
    ];

    public const MAP_ALIASES = [
        'United States of America' => 'United States',
        'Dominican Rep.' => 'Dominican Republic',
        'Dem. Rep. Congo' => 'Democratic Republic of the Congo',
        'Central African Rep.' => 'Central African Republic',
        'Eq. Guinea' => 'Equatorial Guinea',
        'eSwatini' => 'Eswatini',
        'Bosnia and Herz.' => 'Bosnia and Herzegovina',
        'Czechia' => 'Czech Republic',
        'S. Sudan' => 'South Sudan',
        'Solomon Is.' => 'Solomon Islands',
        'Falkland Is.' => 'Falkland Islands',
        'Congo' => 'Congo (Republic of the)',
        'Lao PDR' => 'Laos',
        'Korea' => 'South Korea',
        'Dem. Rep. Korea' => 'North Korea',
    ];

    public function ready(): bool
    {
        return Schema::hasTable('bd_markets');
    }

    public function mayEdit(User $user): bool
    {
        $user->loadMissing('role');

        return (bool) ($user->role?->canCreateUpdateItems());
    }

    /**
     * @return array<string, mixed>
     */
    public function payload(User $user): array
    {
        if (! $this->ready()) {
            throw new InvalidArgumentException('The Business Development tables are not installed yet.');
        }

        $this->ensureJurisdictionLinks();

        $regions = DB::table('bd_regions')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['ID', 'code', 'name'])
            ->map(fn ($row) => [
                'id' => (int) $row->ID,
                'code' => $row->code,
                'name' => $row->name,
            ])
            ->all();

        $segments = [];
        $segmentNames = [];
        foreach (DB::table('bd_segments')->orderBy('sort_order')->orderBy('name')->get(['ID', 'name', 'mod_date']) as $row) {
            $segments[] = [
                'id' => (int) $row->ID,
                'name' => $row->name,
                'modDate' => $row->mod_date,
            ];
            $segmentNames[] = $row->name;
        }

        $links = [];
        $linkRows = DB::table('bd_market_segments as ms')
            ->join('bd_segments as s', 's.ID', '=', 'ms.segment_ID')
            ->orderBy('s.sort_order')
            ->orderBy('s.name')
            ->get(['ms.market_ID', 's.ID', 's.name', 'ms.presence']);
        foreach ($linkRows as $row) {
            $links[(int) $row->market_ID][] = [
                'id' => (int) $row->ID,
                'name' => $row->name,
                'presence' => $row->presence,
            ];
        }

        $jurisdictionIds = [];
        if (Schema::hasTable('bd_market_jurisdictions')) {
            foreach (DB::table('bd_market_jurisdictions')->orderBy('jurisdiction_ID')->get(['market_ID', 'jurisdiction_ID']) as $row) {
                $jurisdictionIds[(int) $row->market_ID][] = (int) $row->jurisdiction_ID;
            }
        }

        $markets = [];
        $marketRows = DB::table('bd_markets as m')
            ->join('bd_regions as r', 'r.ID', '=', 'm.region_ID')
            ->orderBy('m.name')
            ->get([
                'm.ID',
                'm.name',
                'm.status',
                'm.mod_date',
                'r.ID as region_id',
                'r.code',
                'r.name as region_name',
            ]);
        foreach ($marketRows as $row) {
            $id = (int) $row->ID;
            $markets[] = [
                'id' => $id,
                'country' => $row->name,
                'status' => $row->status,
                'regionId' => (int) $row->region_id,
                'region' => $row->code,
                'regionName' => $row->region_name,
                'modDate' => $row->mod_date,
                'jurisdictionIds' => $jurisdictionIds[$id] ?? [],
                'segments' => $links[$id] ?? [],
            ];
        }

        return [
            'statuses' => $this->statusPayload(),
            'presence' => self::PRESENCE,
            'regions' => $regions,
            'segments' => $segmentNames,
            'segmentOptions' => $segments,
            'jurisdictions' => $this->jurisdictionCatalog(),
            'markets' => $markets,
            'regionSegments' => $this->regionSegments(),
            'aliases' => self::MAP_ALIASES,
            'mayEdit' => $this->mayEdit($user),
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function createMarket(User $user, array $input): array
    {
        if (! $this->mayEdit($user)) {
            throw new InvalidArgumentException('You cannot create markets.');
        }

        $name = trim((string) ($input['name'] ?? ''));
        $status = (string) ($input['status'] ?? '');
        $regionId = (int) ($input['region_id'] ?? $input['regionId'] ?? 0);
        $segmentIds = $this->intList($input['segment_ids'] ?? $input['segmentIds'] ?? []);

        if ($name === '' || mb_strlen($name) > 120) {
            throw new InvalidArgumentException('Enter a market name of up to 120 characters.');
        }
        if (! isset(self::STATUSES[$status])) {
            throw new InvalidArgumentException('Choose a valid market status.');
        }
        if ($regionId < 1 || ! $this->regionExists($regionId)) {
            throw new InvalidArgumentException('Choose a region.');
        }
        if ($this->marketNameExists($name)) {
            throw new InvalidArgumentException('A market with that name already exists.');
        }

        if ($status === 'nogo') {
            $segmentIds = [];
        } else {
            $segmentIds = $this->filterExistingSegments($segmentIds);
        }

        $jurisdictionIds = $this->acceptedJurisdictionIds(
            $input['jurisdiction_ids'] ?? $input['jurisdictionIds'] ?? [],
            0,
            $segmentIds,
            [],
        );

        $marketId = 0;
        DB::transaction(function () use ($user, $name, $status, $regionId, $segmentIds, $jurisdictionIds, &$marketId) {
            $marketId = $this->nextId('bd_markets');
            DB::table('bd_markets')->insert([
                'ID' => $marketId,
                'mod_by' => (int) $user->ID,
                'name' => $name,
                'region_ID' => $regionId,
                'status' => $status,
            ]);
            foreach ($segmentIds as $segmentId) {
                DB::table('bd_market_segments')->insert([
                    'market_ID' => $marketId,
                    'segment_ID' => $segmentId,
                    'presence' => 'present',
                ]);
            }
            $this->replaceJurisdictionLinks($marketId, $jurisdictionIds);
        });

        return [
            'ok' => true,
            'market' => $this->marketById($user, $marketId),
            'payload' => $this->payload($user),
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function updateMarket(User $user, array $input): array
    {
        if (! $this->mayEdit($user)) {
            throw new InvalidArgumentException('You cannot edit markets.');
        }

        $marketId = (int) ($input['id'] ?? 0);
        $name = trim((string) ($input['name'] ?? ''));
        $status = (string) ($input['status'] ?? '');
        $regionId = (int) ($input['region_id'] ?? $input['regionId'] ?? 0);
        $segmentIds = $this->intList($input['segment_ids'] ?? $input['segmentIds'] ?? []);

        if ($marketId < 1 || $this->marketById($user, $marketId) === null) {
            throw new InvalidArgumentException('Market not found.');
        }
        if ($name === '' || mb_strlen($name) > 120) {
            throw new InvalidArgumentException('Enter a market name of up to 120 characters.');
        }
        if (! isset(self::STATUSES[$status])) {
            throw new InvalidArgumentException('Choose a valid market status.');
        }
        if ($regionId < 1 || ! $this->regionExists($regionId)) {
            throw new InvalidArgumentException('Choose a region.');
        }
        if ($this->marketNameExists($name, $marketId)) {
            throw new InvalidArgumentException('A market with that name already exists.');
        }

        if ($status === 'nogo') {
            $segmentIds = [];
        } else {
            $segmentIds = $this->filterExistingSegments($segmentIds);
        }

        $existing = [];
        foreach (DB::table('bd_market_segments')->where('market_ID', $marketId)->get(['segment_ID', 'presence']) as $row) {
            $existing[(int) $row->segment_ID] = $row->presence;
        }

        $jurisdictionIds = $this->acceptedJurisdictionIds(
            $input['jurisdiction_ids'] ?? $input['jurisdictionIds'] ?? [],
            $marketId,
            $segmentIds,
            $existing,
        );

        DB::transaction(function () use ($user, $marketId, $name, $status, $regionId, $segmentIds, $existing, $jurisdictionIds) {
            DB::table('bd_markets')->where('ID', $marketId)->update([
                'mod_by' => (int) $user->ID,
                'name' => $name,
                'region_ID' => $regionId,
                'status' => $status,
            ]);
            DB::table('bd_market_segments')->where('market_ID', $marketId)->delete();
            foreach ($segmentIds as $segmentId) {
                DB::table('bd_market_segments')->insert([
                    'market_ID' => $marketId,
                    'segment_ID' => $segmentId,
                    'presence' => $existing[$segmentId] ?? 'present',
                ]);
            }
            $this->replaceJurisdictionLinks($marketId, $jurisdictionIds);
        });

        return [
            'ok' => true,
            'market' => $this->marketById($user, $marketId),
            'payload' => $this->payload($user),
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function createSegment(User $user, array $input): array
    {
        if (! $this->mayEdit($user)) {
            throw new InvalidArgumentException('You cannot create segments.');
        }

        $name = trim((string) ($input['name'] ?? ''));
        if ($name === '' || mb_strlen($name) > 80) {
            throw new InvalidArgumentException('Enter a segment name of up to 80 characters.');
        }
        if (DB::table('bd_segments')->where('name', $name)->exists()) {
            throw new InvalidArgumentException('A segment with that name already exists.');
        }

        $sort = (int) (DB::table('bd_segments')->max('sort_order') ?? 0) + 1;
        $segmentId = $this->nextId('bd_segments');
        DB::table('bd_segments')->insert([
            'ID' => $segmentId,
            'mod_by' => (int) $user->ID,
            'name' => $name,
            'sort_order' => $sort,
        ]);

        return [
            'ok' => true,
            'segment' => ['id' => $segmentId, 'name' => $name],
            'payload' => $this->payload($user),
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function updateSegment(User $user, array $input): array
    {
        if (! $this->mayEdit($user)) {
            throw new InvalidArgumentException('You cannot edit segments.');
        }

        $segmentId = (int) ($input['id'] ?? 0);
        $name = trim((string) ($input['name'] ?? ''));
        if ($segmentId < 1 || ! DB::table('bd_segments')->where('ID', $segmentId)->exists()) {
            throw new InvalidArgumentException('Segment not found.');
        }
        if ($name === '' || mb_strlen($name) > 80) {
            throw new InvalidArgumentException('Enter a segment name of up to 80 characters.');
        }
        if (DB::table('bd_segments')->where('name', $name)->where('ID', '<>', $segmentId)->exists()) {
            throw new InvalidArgumentException('A segment with that name already exists.');
        }

        DB::table('bd_segments')->where('ID', $segmentId)->update([
            'mod_by' => (int) $user->ID,
            'name' => $name,
        ]);

        return [
            'ok' => true,
            'segment' => ['id' => $segmentId, 'name' => $name],
            'payload' => $this->payload($user),
        ];
    }

    private function ensureJurisdictionLinks(): void
    {
        if (! Schema::hasTable('bd_market_jurisdictions')) {
            return;
        }

        $comment = (string) (DB::selectOne(
            'SELECT TABLE_COMMENT AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1',
            ['bd_market_jurisdictions']
        )->c ?? '');

        if (! str_contains($comment, 'matched')) {
            $this->autoMatchJurisdictionLinks();
            DB::statement("ALTER TABLE `bd_market_jurisdictions` COMMENT = 'matched'");
        }

        $this->pruneIneligibleJurisdictionLinks();
    }

    private function autoMatchJurisdictionLinks(): void
    {
        $markets = [];
        foreach (DB::table('bd_markets')->get(['ID', 'name']) as $row) {
            $markets[$row->name] = (int) $row->ID;
        }
        $operated = $this->operatedSegmentIdsByMarket();
        $linked = [];
        foreach (DB::table('bd_market_jurisdictions')->pluck('jurisdiction_ID') as $id) {
            $linked[(int) $id] = true;
        }

        foreach ($this->jurisdictionRows() as $item) {
            if (! $item['suggest'] || isset($linked[$item['id']])) {
                continue;
            }
            $marketId = $markets[$item['country']] ?? 0;
            if ($marketId < 1 || ! $this->linkAllowed($item, $operated[$marketId] ?? [])) {
                continue;
            }
            DB::table('bd_market_jurisdictions')->insert([
                'market_ID' => $marketId,
                'jurisdiction_ID' => $item['id'],
            ]);
            $linked[$item['id']] = true;
        }
    }

    private function pruneIneligibleJurisdictionLinks(): void
    {
        $byId = [];
        foreach ($this->jurisdictionRows() as $item) {
            $byId[$item['id']] = $item;
        }
        $drop = [];
        foreach (DB::table('bd_market_jurisdictions')->pluck('jurisdiction_ID') as $raw) {
            $jurisdictionId = (int) $raw;
            $item = $byId[$jurisdictionId] ?? null;
            if ($item === null || $item['channel'] !== 'land-based' || str_starts_with($item['name'], '(')) {
                $drop[] = $jurisdictionId;
            }
        }
        if ($drop !== []) {
            DB::table('bd_market_jurisdictions')->whereIn('jurisdiction_ID', $drop)->delete();
        }
    }

    /**
     * @return array<int, list<int>>
     */
    private function operatedSegmentIdsByMarket(): array
    {
        $operated = [];
        $rows = DB::table('bd_market_segments')
            ->whereIn('presence', ['present', 'limited', 'planned'])
            ->get(['market_ID', 'segment_ID']);
        foreach ($rows as $row) {
            $operated[(int) $row->market_ID][] = (int) $row->segment_ID;
        }

        return $operated;
    }

    /**
     * @param  list<int>  $segmentIds
     * @param  array<int, string>  $existingPresence
     * @return list<int>
     */
    private function acceptedJurisdictionIds(mixed $raw, int $marketId, array $segmentIds, array $existingPresence): array
    {
        $ids = $this->intList($raw);
        if ($ids === []) {
            return [];
        }

        $byId = [];
        foreach ($this->jurisdictionRows() as $item) {
            $byId[$item['id']] = $item;
        }

        $accepted = [];
        foreach ($ids as $id) {
            $item = $byId[$id] ?? null;
            if ($item === null || $item['channel'] !== 'land-based' || str_starts_with($item['name'], '(')) {
                throw new InvalidArgumentException('Choose a land-based jurisdiction.');
            }
            $taken = DB::table('bd_market_jurisdictions')
                ->where('jurisdiction_ID', $id)
                ->where('market_ID', '<>', $marketId)
                ->value('market_ID');
            if ($taken) {
                throw new InvalidArgumentException($item['name'].' is already linked to another market.');
            }
            $accepted[] = $id;
        }

        return $accepted;
    }

    /** @param list<int> $jurisdictionIds */
    private function replaceJurisdictionLinks(int $marketId, array $jurisdictionIds): void
    {
        DB::table('bd_market_jurisdictions')->where('market_ID', $marketId)->delete();
        foreach ($jurisdictionIds as $jurisdictionId) {
            DB::table('bd_market_jurisdictions')->insert([
                'market_ID' => $marketId,
                'jurisdiction_ID' => $jurisdictionId,
            ]);
        }
    }

    /**
     * @param  array{channel: string, bdSegmentIds: list<int>, bdSegmentNames: list<string>}  $item
     * @param  list<int>  $operated
     */
    private function linkAllowed(array $item, array $operated): bool
    {
        if ($item['channel'] !== 'land-based') {
            return false;
        }
        if ($item['bdSegmentNames'] === []) {
            return true;
        }
        if (count($item['bdSegmentIds']) !== count($item['bdSegmentNames'])) {
            return false;
        }
        foreach ($item['bdSegmentIds'] as $segmentId) {
            if (! in_array($segmentId, $operated, true)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function jurisdictionCatalog(): array
    {
        $list = [];
        foreach ($this->jurisdictionRows() as $item) {
            if ($item['channel'] !== 'land-based' || str_starts_with($item['name'], '(')) {
                continue;
            }
            $list[] = $item;
        }

        return $list;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function jurisdictionRows(): array
    {
        if (! Schema::hasTable('jurisdictions')) {
            return [];
        }

        $segmentIds = [];
        foreach (DB::table('bd_segments')->get(['ID', 'name']) as $row) {
            $segmentIds[$row->name] = (int) $row->ID;
        }

        $holders = [];
        if (Schema::hasTable('bd_market_jurisdictions')) {
            foreach (DB::table('bd_market_jurisdictions')->get(['market_ID', 'jurisdiction_ID']) as $row) {
                $holders[(int) $row->jurisdiction_ID] = (int) $row->market_ID;
            }
        }

        $rows = [];
        foreach (DB::table('jurisdictions')->get(['ID', 'name_english', 'segment', 'segment_name', 'flag', 'parent_ID']) as $row) {
            $id = (int) $row->ID;
            $name = (string) $row->name_english;
            $rows[$id] = [
                'id' => $id,
                'name' => $name,
                'flag' => $row->flag,
                'channel' => (string) $row->segment,
                'parent' => $row->parent_ID !== null ? (int) $row->parent_ID : 0,
                'own' => $this->ownSegmentNames((string) $row->segment_name, $name),
                'plain' => ! str_contains($name, ','),
                'country' => $this->countryLabel($name),
            ];
        }

        $memo = [];
        $list = [];
        foreach ($rows as $id => $row) {
            $names = $this->resolvedSegmentNames($id, $rows, $memo);
            $ids = [];
            foreach ($names as $segmentName) {
                if (isset($segmentIds[$segmentName])) {
                    $ids[] = $segmentIds[$segmentName];
                }
            }
            $list[] = [
                'id' => $id,
                'name' => $row['name'],
                'flag' => $row['flag'],
                'channel' => $row['channel'],
                'country' => $row['country'],
                'bdSegmentIds' => $ids,
                'bdSegmentNames' => $names,
                'suggest' => $row['own'] !== [] || $row['plain'],
                'marketId' => $holders[$id] ?? null,
            ];
        }

        usort($list, static fn (array $a, array $b): int => strcasecmp($a['name'], $b['name']));

        return $list;
    }

    /**
     * @param  array<int, array{own: list<string>, parent: int}>  $rows
     * @param  array<int, list<string>>  $memo
     * @return list<string>
     */
    private function resolvedSegmentNames(int $id, array $rows, array &$memo): array
    {
        if (isset($memo[$id])) {
            return $memo[$id];
        }
        $memo[$id] = [];
        if (! isset($rows[$id])) {
            return [];
        }
        if ($rows[$id]['own'] !== []) {
            $memo[$id] = $rows[$id]['own'];

            return $memo[$id];
        }
        $parent = $rows[$id]['parent'];
        if ($parent > 0 && $parent !== $id && isset($rows[$parent])) {
            $memo[$id] = $this->resolvedSegmentNames($parent, $rows, $memo);
        }

        return $memo[$id];
    }

    /** @return list<string> */
    private function ownSegmentNames(string $segmentName, string $english): array
    {
        $fromField = $this->tokensToSegmentNames($segmentName);
        if ($fromField !== []) {
            return $fromField;
        }

        return $this->tokensToSegmentNames($english);
    }

    /** @return list<string> */
    private function tokensToSegmentNames(string $value): array
    {
        if (! preg_match_all('/[a-z0-9]+/i', strtolower($value), $matches)) {
            return [];
        }
        $names = [];
        foreach ($matches[0] as $token) {
            if (isset(self::PLACE_TO_SEGMENT[$token])) {
                $names[] = self::PLACE_TO_SEGMENT[$token];
            }
        }

        return array_values(array_unique($names));
    }

    private function countryLabel(string $english): string
    {
        $english = trim($english);
        $key = strtolower($english);
        if (isset(self::COUNTRY_ALIASES[$key])) {
            return self::COUNTRY_ALIASES[$key];
        }
        $prefix = $english;
        $comma = strpos($english, ',');
        if ($comma !== false) {
            $prefix = trim(substr($english, 0, $comma));
        }
        $prefixKey = strtolower($prefix);

        return self::COUNTRY_ALIASES[$prefixKey] ?? $prefix;
    }

    /** @return array{id: int, country: string, status: string, regionId: int, region: string, regionName: string, modDate: mixed, jurisdictionIds: list<int>, segments: list<array<string, mixed>>}|null */
    private function marketById(User $user, int $id): ?array
    {
        foreach ($this->payload($user)['markets'] as $market) {
            if ((int) $market['id'] === $id) {
                return $market;
            }
        }

        return null;
    }

    private function regionExists(int $id): bool
    {
        return DB::table('bd_regions')->where('ID', $id)->exists();
    }

    private function marketNameExists(string $name, int $exceptId = 0): bool
    {
        $query = DB::table('bd_markets')->where('name', $name);
        if ($exceptId > 0) {
            $query->where('ID', '<>', $exceptId);
        }

        return $query->exists();
    }

    /**
     * @param  list<int>  $ids
     * @return list<int>
     */
    private function filterExistingSegments(array $ids): array
    {
        $ids = array_values(array_unique(array_filter($ids, static fn (int $id): bool => $id > 0)));
        if ($ids === []) {
            return [];
        }

        return DB::table('bd_segments')->whereIn('ID', $ids)->pluck('ID')->map(fn ($id) => (int) $id)->all();
    }

    /** @return list<int> */
    private function intList(mixed $raw): array
    {
        if (! is_array($raw)) {
            if (is_string($raw) && $raw !== '') {
                $raw = explode(',', $raw);
            } else {
                return [];
            }
        }
        $ids = [];
        foreach ($raw as $value) {
            $id = (int) $value;
            if ($id > 0) {
                $ids[] = $id;
            }
        }

        return array_values(array_unique($ids));
    }

    private function nextId(string $table): int
    {
        return (int) (DB::table($table)->max('ID') ?? 0) + 1;
    }

    /**
     * @return list<array{code: string, label: string, summary: string, definition: string, color: string}>
     */
    private function statusPayload(): array
    {
        $statuses = [];
        foreach (self::STATUSES as $code => $status) {
            $statuses[] = [
                'code' => $code,
                'label' => $status['label'],
                'summary' => $status['summary'],
                'definition' => $status['definition'],
                'color' => $status['color'],
            ];
        }

        return $statuses;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function regionSegments(): array
    {
        $rows = DB::table('bd_regions as r')
            ->join('bd_markets as m', 'm.region_ID', '=', 'r.ID')
            ->join('bd_market_segments as ms', 'ms.market_ID', '=', 'm.ID')
            ->join('bd_segments as s', 's.ID', '=', 'ms.segment_ID')
            ->groupBy('r.ID', 'r.code', 'r.name', 'r.sort_order', 's.ID', 's.name', 's.sort_order', 'ms.presence')
            ->orderBy('r.sort_order')
            ->orderBy('s.sort_order')
            ->orderBy('ms.presence')
            ->get([
                'r.code',
                'r.name as region_name',
                'r.sort_order',
                's.ID as segment_id',
                's.name as segment_name',
                's.sort_order as segment_sort',
                'ms.presence',
                DB::raw('COUNT(*) as n'),
            ]);

        $grouped = [];
        foreach ($rows as $row) {
            $key = $row->code."\0".$row->segment_name;
            if (! isset($grouped[$key])) {
                $grouped[$key] = [
                    'code' => $row->code,
                    'region' => $row->region_name,
                    'sort' => (int) $row->sort_order,
                    'segmentId' => (int) $row->segment_id,
                    'segment' => $row->segment_name,
                    'segmentSort' => (int) $row->segment_sort,
                    'counts' => [],
                ];
            }
            $grouped[$key]['counts'][$row->presence] = (int) $row->n;
        }

        $byRegion = [];
        foreach ($grouped as $item) {
            $winner = 'absent';
            foreach ($item['counts'] as $presence => $count) {
                if ($count > 0 && self::PRESENCE_RANK[$presence] > self::PRESENCE_RANK[$winner]) {
                    $winner = $presence;
                }
            }
            $code = $item['code'];
            if (! isset($byRegion[$code])) {
                $byRegion[$code] = [
                    'code' => $code,
                    'name' => $item['region'],
                    'sort' => $item['sort'],
                    'segments' => [],
                ];
            }
            $total = array_sum($item['counts']);
            $byRegion[$code]['segments'][] = [
                'id' => $item['segmentId'],
                'name' => $item['segment'],
                'presence' => $winner,
                'markets' => $item['counts'][$winner] ?? 0,
                'total' => $total,
            ];
        }

        $allSegments = DB::table('bd_segments')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['ID', 'name'])
            ->map(fn ($row) => ['id' => (int) $row->ID, 'name' => $row->name])
            ->all();

        foreach ($this->allRegions() as $region) {
            if (! isset($byRegion[$region['code']])) {
                $byRegion[$region['code']] = [
                    'code' => $region['code'],
                    'name' => $region['name'],
                    'sort' => $region['sort'],
                    'segments' => [],
                ];
            }
            $known = array_column($byRegion[$region['code']]['segments'], 'name');
            foreach ($allSegments as $segment) {
                if (! in_array($segment['name'], $known, true)) {
                    $byRegion[$region['code']]['segments'][] = [
                        'id' => $segment['id'],
                        'name' => $segment['name'],
                        'presence' => 'absent',
                        'markets' => 0,
                        'total' => 0,
                    ];
                }
            }
        }

        $regions = array_values($byRegion);
        usort($regions, static fn (array $a, array $b): int => $a['sort'] <=> $b['sort']);

        return $regions;
    }

    /**
     * @return list<array{code: string, name: string, sort: int}>
     */
    private function allRegions(): array
    {
        return DB::table('bd_regions')
            ->orderBy('sort_order')
            ->get(['code', 'name', 'sort_order'])
            ->map(fn ($row) => [
                'code' => $row->code,
                'name' => $row->name,
                'sort' => (int) $row->sort_order,
            ])
            ->all();
    }
}
