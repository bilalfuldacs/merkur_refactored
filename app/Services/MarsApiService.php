<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class MarsApiService
{
    public const MAX_LIMIT = 1000;

    /**
     * @return array<string, mixed>
     */
    public function index(): array
    {
        $base = rtrim((string) config('app.url'), '/').'/api';

        return [
            'name' => 'MERKURflow MARS API',
            'read_only' => true,
            'auth' => [
                'Authorization: Bearer <token>',
                'X-API-Key: <token>',
            ],
            'endpoints' => [
                'business-partners' => [
                    'path' => $base.'/mars/business-partners',
                    'table' => 'partners',
                ],
                'venues' => [
                    'path' => $base.'/mars/venues',
                    'table' => 'venues',
                ],
                'versions' => [
                    'path' => $base.'/mars/versions',
                    'table' => 'versions',
                ],
            ],
            'query' => [
                'id' => 'optional single record',
                'include_inactive' => '1 to include inactive partners and venues',
                'updated_since' => 'YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS',
                'limit' => '1–'.self::MAX_LIMIT.', default '.self::MAX_LIMIT,
                'offset' => 'default 0',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function businessPartners(Request $request): array
    {
        $filters = $this->filters($request, true);
        $query = DB::table('partners as t');
        $this->applyFilters($query, $filters);
        $total = (clone $query)->count();
        $rows = $query->orderBy('t.ID')
            ->limit($filters['limit'])
            ->offset($filters['offset'])
            ->get(['t.ID', 't.name', 't.website', 't.active', 't.mod_date'])
            ->map(fn ($row) => [
                'id' => (int) $row->ID,
                'name' => (string) $row->name,
                'website' => $this->nullableString($row->website),
                'active' => (int) $row->active === 1,
                'updated_at' => $this->isoUtc($row->mod_date),
            ])
            ->all();

        return $this->listPayload('business-partners', $filters, $total, $rows);
    }

    /**
     * @return array<string, mixed>
     */
    public function venues(Request $request): array
    {
        $filters = $this->filters($request, true);
        $query = DB::table('venues as t')
            ->leftJoin('partners as p', 'p.ID', '=', 't.partner_ID')
            ->leftJoin('jurisdictions as j', 'j.ID', '=', 't.jurisdiction_ID');
        $this->applyFilters($query, $filters);
        $total = (clone $query)->count('t.ID');
        $rows = $query->orderBy('t.ID')
            ->limit($filters['limit'])
            ->offset($filters['offset'])
            ->get([
                't.ID',
                't.name',
                't.active',
                't.mod_date',
                't.street_address',
                't.city',
                't.province',
                't.postal_code',
                't.location',
                't.partner_ID',
                'p.name as partner_name',
                't.jurisdiction_ID',
                'j.iso3166 as jurisdiction_iso3166',
                'j.name_english as jurisdiction_name',
            ])
            ->map(fn ($row) => [
                'id' => (int) $row->ID,
                'name' => (string) $row->name,
                'active' => (int) $row->active === 1,
                'partner' => $row->partner_ID !== null ? [
                    'id' => (int) $row->partner_ID,
                    'name' => (string) $row->partner_name,
                ] : null,
                'jurisdiction' => $row->jurisdiction_ID !== null ? [
                    'id' => (int) $row->jurisdiction_ID,
                    'iso3166' => $this->nullableString($row->jurisdiction_iso3166),
                    'name' => $this->nullableString($row->jurisdiction_name),
                ] : null,
                'address' => [
                    'street' => $this->nullableString($row->street_address),
                    'city' => $this->nullableString($row->city),
                    'province' => $this->nullableString($row->province),
                    'postal_code' => $this->nullableString($row->postal_code),
                    'location' => $this->nullableString($row->location),
                ],
                'updated_at' => $this->isoUtc($row->mod_date),
            ])
            ->all();

        return $this->listPayload('venues', $filters, $total, $rows);
    }

    /**
     * @return array<string, mixed>
     */
    public function versions(Request $request): array
    {
        $filters = $this->filters($request, false);
        $query = DB::table('versions as t')
            ->leftJoin('platforms as pl', 'pl.ID', '=', 't.platform_ID')
            ->leftJoin('config__statuses as st', 'st.ID', '=', 't.status_ID')
            ->leftJoin('versions as iv', 'iv.ID', '=', 't.inherits_ID');
        $this->applyFilters($query, $filters);
        $total = (clone $query)->count('t.ID');
        $rows = $query->orderBy('t.ID')
            ->limit($filters['limit'])
            ->offset($filters['offset'])
            ->get([
                't.ID',
                't.name',
                't.name2',
                't.subtitle',
                't.description',
                't.mod_date',
                't.platform_ID',
                'pl.name as platform_name',
                't.status_ID',
                'st.name as status_name',
                't.inherits_ID',
                'iv.name as inherits_name',
                'iv.name2 as inherits_name2',
            ])
            ->map(fn ($row) => [
                'id' => (int) $row->ID,
                'name' => (string) $row->name,
                'name2' => $this->nullableString($row->name2),
                'subtitle' => $this->nullableString($row->subtitle),
                'description' => $this->nullableString($row->description),
                'platform' => [
                    'id' => (int) $row->platform_ID,
                    'name' => (string) $row->platform_name,
                ],
                'status' => $row->status_ID !== null ? [
                    'id' => (int) $row->status_ID,
                    'name' => (string) $row->status_name,
                ] : null,
                'inherits_from' => $row->inherits_ID !== null ? [
                    'id' => (int) $row->inherits_ID,
                    'name' => (string) $row->inherits_name,
                    'name2' => $this->nullableString($row->inherits_name2),
                ] : null,
                'updated_at' => $this->isoUtc($row->mod_date),
            ])
            ->all();

        return $this->listPayload('versions', $filters, $total, $rows);
    }

    /**
     * @return array{id:?int, include_inactive:bool, updated_since:?string, limit:int, offset:int, has_active:bool}
     */
    private function filters(Request $request, bool $hasActiveColumn): array
    {
        $id = null;
        if ($request->filled('id')) {
            if (! preg_match('/^\d+$/', (string) $request->query('id'))) {
                throw new InvalidArgumentException('id must be a positive integer');
            }
            $id = (int) $request->query('id');
            if ($id < 1) {
                throw new InvalidArgumentException('id must be a positive integer');
            }
        }

        $limit = self::MAX_LIMIT;
        if ($request->filled('limit')) {
            if (! preg_match('/^\d+$/', (string) $request->query('limit'))) {
                throw new InvalidArgumentException('limit must be a positive integer');
            }
            $limit = (int) $request->query('limit');
            if ($limit < 1 || $limit > self::MAX_LIMIT) {
                throw new InvalidArgumentException('limit must be between 1 and '.self::MAX_LIMIT);
            }
        }

        $offset = 0;
        if ($request->filled('offset')) {
            if (! preg_match('/^\d+$/', (string) $request->query('offset'))) {
                throw new InvalidArgumentException('offset must be a non-negative integer');
            }
            $offset = (int) $request->query('offset');
        }

        $updatedSince = null;
        if ($request->filled('updated_since')) {
            $updatedSince = $this->parseUpdatedSince((string) $request->query('updated_since'));
        }

        $includeInactive = false;
        if ($hasActiveColumn && $request->has('include_inactive')) {
            $includeInactive = ! in_array((string) $request->query('include_inactive'), ['0', 'false', ''], true);
        }

        return [
            'id' => $id,
            'include_inactive' => $includeInactive,
            'updated_since' => $updatedSince,
            'limit' => $limit,
            'offset' => $offset,
            'has_active' => $hasActiveColumn,
        ];
    }

    /**
     * @param  \Illuminate\Database\Query\Builder  $query
     * @param  array{id:?int, include_inactive:bool, updated_since:?string, has_active:bool}  $filters
     */
    private function applyFilters($query, array $filters): void
    {
        if ($filters['has_active'] && ! $filters['include_inactive']) {
            $query->where('t.active', 1);
        }
        if ($filters['id'] !== null) {
            $query->where('t.ID', $filters['id']);
        }
        if ($filters['updated_since'] !== null) {
            $query->where('t.mod_date', '>=', $filters['updated_since']);
        }
    }

    private function parseUpdatedSince(string $raw): string
    {
        $raw = trim($raw);
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw) === 1) {
            return $raw.' 00:00:00';
        }
        if (preg_match('/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}$/', $raw) === 1) {
            return str_replace('T', ' ', $raw);
        }

        throw new InvalidArgumentException('updated_since must be YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS');
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @param  array{id:?int, limit:int, offset:int}  $filters
     * @return array<string, mixed>
     */
    private function listPayload(string $table, array $filters, int $total, array $rows): array
    {
        if ($filters['id'] !== null && $total === 0) {
            throw new InvalidArgumentException('Not found');
        }

        return [
            'table' => $table,
            'total' => $total,
            'count' => count($rows),
            'limit' => $filters['limit'],
            'offset' => $filters['offset'],
            'data' => $rows,
        ];
    }

    private function isoUtc(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        $date = $value instanceof Carbon ? $value : Carbon::parse((string) $value);

        return $date->utc()->format('Y-m-d\TH:i:s').'Z';
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $string = trim((string) $value);

        return $string === '' ? null : $string;
    }
}
