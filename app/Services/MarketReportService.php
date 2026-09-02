<?php

namespace App\Services;

use App\Models\Jurisdiction;
use App\Models\MarketLandbased;
use App\Models\MarketOnline;
use App\Models\PartnerActivity;
use App\Models\StakeJurisdiction;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

class MarketReportService
{
    private const SHARE_COLORS = [
        '#009FE3', '#55BFEC', '#AADFF6',
        '#ABB5C5', '#566A8C', '#022052',
        '#EB0000', '#F25555', '#F8AAAA',
        '#A2C617',
        '#E83181', '#F07E25', '#EDEDED', '#B2B2B2', '#898B8E', '#DADADA',
    ];

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
    public function payload(User $user, int $jurisdictionId): array
    {
        $jurisdiction = Jurisdiction::query()
            ->with(['authority', 'editor', 'landbasedMarket.editor', 'onlineMarket.editor'])
            ->find($jurisdictionId);

        if (! $jurisdiction instanceof Jurisdiction) {
            throw new InvalidArgumentException('Unknown market.');
        }
        if (! in_array($jurisdiction->segment, ['land-based', 'online'], true)) {
            throw new InvalidArgumentException('Unknown market.');
        }

        $user->loadMissing('role');
        $table = $jurisdiction->segment === 'online' ? 'markets_online' : 'markets_landbased';
        $market = $jurisdiction->segment === 'online'
            ? $jurisdiction->onlineMarket
            : $jurisdiction->landbasedMarket;

        $hasStake = $user->jurisdictionStakes()
            ->where('jurisdiction_ID', $jurisdictionId)
            ->where('as_deputy', false)
            ->exists();
        $canViewDetails = $hasStake || $user->canAccessUnsubscribedMarkets();
        $accessReason = $hasStake
            ? 'you have a stake in this market'
            : ($user->canAccessUnsubscribedMarkets()
                ? 'of your “Access unsubscribed markets” entitlement'
                : null);

        return [
            'generated_at' => now()->toDateTimeString(),
            'can_edit' => $user->canCreateUpdateItems(),
            'access' => [
                'allowed' => $canViewDetails,
                'reason' => $accessReason,
            ],
            'jurisdiction' => $this->jurisdictionPayload($jurisdiction, $market),
            'stakeholders' => $this->stakeholders($jurisdictionId),
            'last_modified' => [
                'market' => $canViewDetails ? $this->changeInfo($market?->mod_date, $market?->editor) : null,
                'jurisdiction' => $this->changeInfo($jurisdiction->mod_date, $jurisdiction->editor),
                'installations' => $this->tableChange('installations', $jurisdictionId),
                'availabilities' => $this->tableChange('availabilities', $jurisdictionId),
            ],
            'market' => $canViewDetails ? $this->marketPayload($table, $market) : null,
            'key_customers' => $canViewDetails ? $this->keyCustomers($jurisdictionId) : [],
            'installations' => $this->installations($jurisdictionId),
            'availabilities' => $this->availabilities($jurisdictionId),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function jurisdictionPayload(Jurisdiction $jurisdiction, MarketLandbased|MarketOnline|null $market): array
    {
        $authority = $jurisdiction->authority;

        return [
            'id' => $jurisdiction->ID,
            'flag' => $jurisdiction->flag,
            'name' => $jurisdiction->name,
            'name_english' => $jurisdiction->name_english,
            'segment' => $jurisdiction->segment,
            'cluster' => $market?->cluster,
            'iso4217' => $jurisdiction->iso4217,
            'currency_name_english' => $jurisdiction->currency_name_english,
            'authority' => $authority ? [
                'name' => $authority->name,
                'website' => $authority->website,
            ] : null,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function stakeholders(int $jurisdictionId): array
    {
        return StakeJurisdiction::query()
            ->with('person.role')
            ->where('jurisdiction_ID', $jurisdictionId)
            ->where('as_deputy', false)
            ->get()
            ->sortBy(fn (StakeJurisdiction $stake): string => mb_strtolower((string) ($stake->person?->initials ?? '')))
            ->values()
            ->map(function (StakeJurisdiction $stake): ?array {
                $person = $stake->person;
                if (! $person instanceof User) {
                    return null;
                }

                return [
                    'ID' => $person->ID,
                    'initials' => $person->initials,
                    'firstname' => $person->firstname,
                    'lastname' => $person->lastname,
                    'jobtitle' => $person->jobtitle,
                    'bcolor' => $person->bcolor,
                    'color' => $person->color,
                    'role_ID' => $person->role_ID,
                    'role' => $person->role?->name,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>|null
     */
    private function marketPayload(string $table, MarketLandbased|MarketOnline|null $market): ?array
    {
        if ($market === null) {
            return [
                'id' => null,
                'table' => $table,
                'kind' => $table === 'markets_online' ? 'online' : 'landbased',
            ];
        }

        if ($market instanceof MarketOnline) {
            return [
                'id' => $market->ID,
                'table' => $table,
                'kind' => 'online',
                'groups' => $this->onlineGroups($market),
                'notes' => $this->displayValue($market->notes),
            ];
        }

        return [
            'id' => $market->ID,
            'table' => $table,
            'kind' => 'landbased',
            'kpis' => $this->landbasedKpis($market),
            'competitors' => $this->competitors($market),
            'swot' => $this->matrix($market->getAttribute('SWOT_competitors')),
            'top_games' => $this->matrix($market->getAttribute('top_games')),
            'top_games_comment' => $this->displayValue($market->getAttribute('top_games_comment')),
            'game_types' => $this->matrix($market->getAttribute('game_types')),
            'game_types_comment' => $this->displayValue($market->getAttribute('game_types_comment')),
            'top_cabinets' => $this->matrix($market->getAttribute('top_cabinets')),
            'key_perf_metrics' => $this->matrix($market->getAttribute('key_perf_metrics')),
            'key_perf_metrics_comment' => $this->displayValue($market->getAttribute('key_perf_metrics_comment')),
            'mechanics' => $this->propertyRows($market, [
                'volatility*', 'lines*', 'reel_grid*', 'bet_levels-denoms*', 'RTP*', 'progressive_jackpots*',
                'bonus_features', 'feature_triggers', 'volatility_mode_selection', 'adaptive_gameplay',
                'hit_frequency*', 'win_distribution*', 'bonus_frequency', 'avg_bonus_win', 'max_win',
                'pay_table_math', 'prog_seed-contrib*', 'game_cycle', 'hit_to_feature_ratio', 'std_deviation',
            ]),
            'commercial' => $this->propertyRows($market, [
                'core_games*', 'preferred_CG', 'premium_games*', 'preferred_PG', 'avg_selling_price*',
                'revenue_share', 'payback_period', 'LTV*', 'PLR*',
            ]),
            'players' => $this->propertyRows($market, [
                'demographic*', 'socioeconomic*', 'motivation', 'behavior', 'confidence',
            ]),
            'insights' => $this->propertyRows($market, [
                'cultural_pref*', 'opportunities*', 'seasonal_factors', 'emerging_competitors*',
            ]),
            'regulatory' => $this->propertyRows($market, ['cntry_reg_rules', 'local_reg_rules']),
            'recommendations' => $this->propertyRows($market, ['immediate', 'medium_term']),
            'notes' => $this->displayValue($market->notes),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function landbasedKpis(MarketLandbased $market): array
    {
        $totalEgms = $this->intOrNull($market->getAttribute('total_#_of_EGMs'));
        $merkurEgms = $this->intOrNull($market->getAttribute('#_of_MERKUR_EGMs'));
        $floorShare = ($totalEgms !== null && $totalEgms > 0 && $merkurEgms !== null)
            ? round($merkurEgms / $totalEgms * 100, 1)
            : null;
        $winRate = $this->floatOrNull($market->getAttribute('target_win_rate'));

        return [
            'total_egms' => $totalEgms,
            'total_venues' => $this->intOrNull($market->getAttribute('total_#_of_venues')),
            'total_market_revenue' => $this->intOrNull($market->getAttribute('total_market_revenue')),
            'merkur_egms' => $merkurEgms,
            'floor_share' => $floorShare,
            'share_growth' => $this->floatOrNull($market->getAttribute('share_growth')),
            'target_win_rate' => $winRate,
            'asp_per_machine' => $this->displayValue($market->getAttribute('ASP_per_machine')),
            'replacement_rate' => $this->displayValue($market->getAttribute('replacement_rate')),
            'openness_to_switch' => $this->displayValue($market->getAttribute('openness_to_switch')),
        ];
    }

    /**
     * @return array{matrix: array<string, mixed>|null, slices: list<array{value: float, color: string, label: string}>}
     */
    private function competitors(MarketLandbased $market): array
    {
        $totalEgms = $this->intOrNull($market->getAttribute('total_#_of_EGMs')) ?? 0;
        $merkurEgms = $this->intOrNull($market->getAttribute('#_of_MERKUR_EGMs')) ?? 0;
        $matrix = $this->matrix($market->getAttribute('top_competitors'));
        $slices = [];

        if ($totalEgms <= 0 || $matrix === null) {
            return ['matrix' => $matrix, 'slices' => $slices];
        }

        $headers = $matrix['col_headers'];
        $manufacturerCol = array_search('Manufacturer', $headers, true);
        $slotsCol = array_search('Estimated Slots', $headers, true);
        if ($manufacturerCol === false || $slotsCol === false) {
            return ['matrix' => $matrix, 'slices' => $slices];
        }

        $competitorSlots = 0;
        $rows = [];
        foreach ($matrix['data'] as $index => $row) {
            $slots = (int) str_replace(',', '', (string) ($row[$slotsCol] ?? 0));
            $competitorSlots += $slots;
            $color = self::SHARE_COLORS[$index] ?? '#898B8E';
            $percent = round($slots / $totalEgms * 100, 1);
            if ($percent != 0.0) {
                $slices[] = ['value' => $percent, 'color' => $color, 'label' => (string) ($row[$manufacturerCol] ?? 'Competitor')];
            }
            $marker = ['color' => $color];
            $rows[] = array_merge([$marker], $row);
        }

        $used = $merkurEgms + $competitorSlots;
        if ($used > $totalEgms) {
            $used = $totalEgms;
        }
        $residual = $totalEgms - $used;
        array_unshift($slices, ['value' => round($merkurEgms / $totalEgms * 100, 1), 'color' => '#FFCC00', 'label' => 'MERKUR']);
        $slices[] = ['value' => round($residual / $totalEgms * 100, 1), 'color' => '#898B8E', 'label' => 'others'];
        $slices = array_values(array_filter($slices, fn (array $slice): bool => $slice['value'] != 0.0));

        $emptyRow = array_fill(0, count($headers), '');
        $merkurRow = $emptyRow;
        $merkurRow[$manufacturerCol] = 'MERKUR';
        $merkurRow[$slotsCol] = number_format($merkurEgms);
        $otherRow = $emptyRow;
        $otherRow[$manufacturerCol] = 'others';
        $otherRow[$slotsCol] = number_format($residual);

        return [
            'matrix' => [
                'col_headers' => array_merge([''], $headers),
                'row_headers' => array_merge([''], $matrix['row_headers'], ['']),
                'data' => array_merge(
                    [array_merge([['color' => '#FFCC00']], $merkurRow)],
                    $rows,
                    [array_merge([['color' => '#898B8E']], $otherRow)],
                ),
            ],
            'slices' => $slices,
        ];
    }

    /**
     * @return list<array{title: string, rows: list<array<string, mixed>>}>
     */
    private function onlineGroups(MarketOnline $market): array
    {
        $themes = [];
        foreach ([
            'fruits' => 'Fruits',
            'gems' => 'Gems',
            'bars_and_7s' => 'Bars & 7s',
            'space' => 'Space',
            'asia' => 'Asia',
            'egypt' => 'Egypt',
            'nature_and_animals' => 'Nature & Animals',
            'adventure' => 'Adventure',
            'history' => 'History',
            'fantasy_and_mythology' => 'Fantasy & Mythology',
        ] as $field => $label) {
            if ($market->getAttribute($field)) {
                $themes[] = $label;
            }
        }

        return [
            [
                'title' => 'Market',
                'rows' => $this->propertyRows($market, [
                    'product_share', 'product_share_merkur', 'product_share_by_supplier', 'segment_split',
                ]),
            ],
            [
                'title' => 'Games & themes',
                'rows' => array_merge(
                    $this->propertyRows($market, ['game_feature_types', 'seasonally_themed', 'volatility', 'lines', 'denominations', 'sound']),
                    [['key' => 'themes', 'label' => 'Themes', 'value' => $themes === [] ? null : implode(', ', $themes), 'in_exec_summary' => true]],
                ),
            ],
            [
                'title' => 'Devices',
                'rows' => $this->propertyRows($market, ['smartphone', 'tablet', 'notebook', 'desktop', 'tech_requirements']),
            ],
            [
                'title' => 'Players',
                'rows' => $this->propertyRows($market, ['age_groups', 'sex', 'budget', 'spending_segments']),
            ],
            [
                'title' => 'Performance',
                'rows' => $this->propertyRows($market, [
                    'avg_bet', 'avg_bet_merkur', 'lp_all', 'lp_merkur', 'sp_all', 'sp_merkur', 'rg_all', 'rg_merkur',
                ]),
            ],
            [
                'title' => 'Games',
                'rows' => $this->propertyRows($market, [
                    'main_competitors_and_top_3_games', 'top_10_games', 'bottom_10_games', 'new_games',
                ]),
            ],
        ];
    }

    /**
     * @param  list<string>  $fields
     * @return list<array<string, mixed>>
     */
    private function propertyRows(Model $market, array $fields): array
    {
        $rows = [];
        foreach ($fields as $field) {
            $inExec = str_ends_with($field, '*');
            $name = $inExec ? substr($field, 0, -1) : $field;
            $rows[] = [
                'key' => $name,
                'label' => $this->fieldLabel($name),
                'value' => $this->displayValue($market->getAttribute($name)),
                'in_exec_summary' => $inExec,
            ];
        }

        return $rows;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function keyCustomers(int $jurisdictionId): array
    {
        if (! Schema::hasTable('partner_activities')) {
            return [];
        }

        return PartnerActivity::query()
            ->with('partner')
            ->where('jurisdiction_ID', $jurisdictionId)
            ->where('key_customer', true)
            ->orderByDesc('total_machines')
            ->orderBy('ID')
            ->get()
            ->map(function (PartnerActivity $activity): array {
                $partner = $activity->partner;

                return [
                    'id' => $activity->ID,
                    'name' => $partner?->name,
                    'website' => $partner?->website,
                    'total_machines' => $activity->total_machines,
                    'share_of_mfrs' => $activity->share_of_mfrs,
                ];
            })
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function installations(int $jurisdictionId): array
    {
        $empty = [
            'totals' => ['live' => 0, 'test' => 0, 'planned' => 0, 'records' => 0],
            'versions' => [],
        ];
        if (! Schema::hasTable('installations') || ! Schema::hasTable('versions')) {
            return $empty;
        }

        $rows = DB::table('installations as i')
            ->leftJoin('versions as v', 'v.ID', '=', 'i.version_ID')
            ->leftJoin('venues as ve', 've.ID', '=', 'i.venue_ID')
            ->where('i.jurisdiction_ID', $jurisdictionId)
            ->orderByDesc('v.name_SORT')
            ->orderBy('ve.name')
            ->get([
                'i.ID',
                'i.version_ID',
                'i.venue_ID',
                'i.first_install_date',
                'i.live',
                'i.test',
                'i.planned',
                'i.perf_rating',
                'i.tech_rating',
                'i.test_comment',
                'v.name',
                'v.name2',
                'v.name_name2_COMBINED',
                've.name as venue_name',
            ]);

        $grouped = [];
        $totals = ['live' => 0, 'test' => 0, 'planned' => 0, 'records' => 0];
        foreach ($rows as $row) {
            $versionId = (int) $row->version_ID;
            $grouped[$versionId] ??= [
                'ID' => $versionId,
                'label' => trim((string) ($row->name_name2_COMBINED ?: trim($row->name.' '.($row->name2 ?? '')))) ?: 'Version #'.$versionId,
                'first_installed' => null,
                'live' => 0,
                'test' => 0,
                'planned' => 0,
                'records' => 0,
                'ratings' => ['a_plus' => 0, 'a' => 0, 'b' => 0, 'c' => 0, 'd' => 0, 'd_minus' => 0],
                'tech' => ['red' => 0, 'yellow' => 0, 'green' => 0],
                'sites' => [],
            ];

            $live = (int) ($row->live ?? 0);
            $test = (int) ($row->test ?? 0);
            $planned = (int) ($row->planned ?? 0);
            $grouped[$versionId]['live'] += $live;
            $grouped[$versionId]['test'] += $test;
            $grouped[$versionId]['planned'] += $planned;
            $grouped[$versionId]['records']++;
            $totals['live'] += $live;
            $totals['test'] += $test;
            $totals['planned'] += $planned;
            $totals['records']++;

            if ($row->first_install_date) {
                $current = $grouped[$versionId]['first_installed'];
                if ($current === null || (string) $row->first_install_date < (string) $current) {
                    $grouped[$versionId]['first_installed'] = (string) $row->first_install_date;
                }
            }

            $perf = is_numeric($row->perf_rating) ? (int) $row->perf_rating : null;
            if ($perf !== null && isset(self::PERF_KEYS[$perf])) {
                $grouped[$versionId]['ratings'][self::PERF_KEYS[$perf]]++;
            }
            $tech = (string) ($row->tech_rating ?? '');
            if (in_array($tech, ['red', 'yellow', 'green'], true)) {
                $grouped[$versionId]['tech'][$tech]++;
            }

            $grouped[$versionId]['sites'][] = [
                'ID' => (int) $row->ID,
                'venue' => $row->venue_name ?: 'Venue',
                'venue_ID' => $row->venue_ID ? (int) $row->venue_ID : null,
                'date' => $row->first_install_date ? (string) $row->first_install_date : null,
                'live' => $live,
                'test' => $test,
                'planned' => $planned,
                'perf_label' => $perf !== null ? (self::PERF_LABELS[$perf] ?? null) : null,
                'tech_rating' => $tech !== '' ? $tech : null,
                'comment' => $row->test_comment,
            ];
        }

        $versions = [];
        foreach ($grouped as $item) {
            $present = [];
            foreach (self::PERF_LABELS as $value => $label) {
                if (($item['ratings'][self::PERF_KEYS[$value]] ?? 0) > 0) {
                    $present[] = $label;
                }
            }
            $item['performance'] = $present === [] ? null : (count($present) === 1 ? $present[0] : 'mixed');
            $versions[] = $item;
        }

        return ['totals' => $totals, 'versions' => $versions];
    }

    /**
     * @return array{available: list<array<string, mixed>>, intent: list<array<string, mixed>>, no_intent: list<array<string, mixed>>}
     */
    private function availabilities(int $jurisdictionId): array
    {
        $payload = ['available' => [], 'intent' => [], 'no_intent' => []];
        $groups = ['availability' => 'available', 'intent' => 'intent', 'no intent' => 'no_intent'];
        if (! Schema::hasTable('availabilities') || ! Schema::hasTable('versions')) {
            return $payload;
        }

        DB::table('availabilities as a')
            ->leftJoin('versions as v', 'v.ID', '=', 'a.version_ID')
            ->where('a.jurisdiction_ID', $jurisdictionId)
            ->orderByDesc('v.name_SORT')
            ->get([
                'a.ID',
                'a.status',
                'a.priority',
                'v.name',
                'v.name2',
                'v.name_name2_COMBINED',
            ])
            ->each(function (object $row) use (&$payload, $groups): void {
                $bucket = $groups[(string) $row->status] ?? null;
                if ($bucket === null) {
                    return;
                }
                $label = trim((string) ($row->name_name2_COMBINED ?: trim($row->name.' '.($row->name2 ?? ''))));
                $payload[$bucket][] = [
                    'ID' => (int) $row->ID,
                    'label' => $label !== '' ? $label : 'Version',
                    'priority' => $row->priority,
                ];
            });

        return $payload;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function matrix(mixed $value): ?array
    {
        if (is_string($value)) {
            $value = json_decode($value, true);
        }
        if (! is_array($value)) {
            return null;
        }
        if (! isset($value['col_headers'], $value['row_headers'], $value['data'])
            || ! is_array($value['col_headers']) || ! is_array($value['row_headers']) || ! is_array($value['data'])) {
            return null;
        }

        return [
            'col_headers' => array_values($value['col_headers']),
            'row_headers' => array_values($value['row_headers']),
            'data' => array_values($value['data']),
        ];
    }

    /**
     * @return array{at: string|null, by: string|null}|null
     */
    private function changeInfo(mixed $date, mixed $editor): ?array
    {
        if ($date === null && $editor === null) {
            return null;
        }

        $at = $date instanceof Carbon ? $date->toDateTimeString() : (is_string($date) ? $date : null);
        $by = $editor instanceof User
            ? trim((string) ($editor->name_COMBINED ?: trim(($editor->firstname ?? '').' '.($editor->lastname ?? ''))))
            : null;

        return ['at' => $at, 'by' => $by !== '' ? $by : null];
    }

    /**
     * @return array{at: string|null, by: string|null}|null
     */
    private function tableChange(string $table, int $jurisdictionId): ?array
    {
        if (! Schema::hasTable($table)) {
            return null;
        }

        $row = DB::table($table)
            ->leftJoin('dynamic__users', 'dynamic__users.ID', '=', $table.'.mod_by')
            ->where($table.'.jurisdiction_ID', $jurisdictionId)
            ->orderByDesc($table.'.mod_date')
            ->first([$table.'.mod_date', 'dynamic__users.firstname', 'dynamic__users.lastname']);

        if ($row === null) {
            return null;
        }

        $by = trim(($row->firstname ?? '').' '.($row->lastname ?? ''));

        return [
            'at' => $row->mod_date ? (string) $row->mod_date : null,
            'by' => $by !== '' ? $by : null,
        ];
    }

    private function fieldLabel(string $raw): string
    {
        $special = [
            'RTP' => 'RTP',
            'LTV' => 'LTV',
            'PLR' => 'PLR',
            'ASP_per_machine' => 'ASP per Machine',
            'cntry_reg_rules' => 'Country / Reg. Rules',
            'local_reg_rules' => 'Local Reg. Rules',
            'preferred_CG' => 'Preferred CG',
            'preferred_PG' => 'Preferred PG',
            'prog_seed-contrib' => 'Prog Seed & Contrib',
            'bet_levels-denoms' => 'Bet Levels & Denoms',
        ];
        if (isset($special[$raw])) {
            return $special[$raw];
        }

        $label = ucwords(str_replace(['_ID', '_', '-'], ['', ' ', ' & '], $raw));

        return str_replace(['# Of', ' Per ', ' To '], ['# of', ' per ', ' to '], $label);
    }

    private function displayValue(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }
        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }
        if (is_string($value)) {
            return $value;
        }

        return null;
    }

    private function intOrNull(mixed $value): ?int
    {
        return is_numeric($value) ? (int) $value : null;
    }

    private function floatOrNull(mixed $value): ?float
    {
        return is_numeric($value) ? (float) $value : null;
    }
}
