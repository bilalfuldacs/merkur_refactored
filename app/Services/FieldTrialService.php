<?php

namespace App\Services;

use App\Models\User;
use DateTimeImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class FieldTrialService
{
    public const WEEK_COUNT = 16;

    public const MAX_RANGE_WEEKS = 104;

    public const GENERAL_STATUSES = [
        'planned',
        'expected',
        'go live',
        'performance',
        'replacement plan',
        'game replaced',
        'issues',
    ];

    public const MARS_STATUSES = [
        'connection intended',
        'installation',
        'receiving data',
        'issues MARS',
    ];

    public const PHOTO_MAX_BYTES = 15 * 1024 * 1024;

    public const VIDEO_MAX_BYTES = 150 * 1024 * 1024;

    public function mayEdit(User $user): bool
    {
        return (bool) $user->role?->canCreateUpdateItems();
    }

    /**
     * @return array<string, mixed>
     */
    public function tree(User $user, ?string $from, ?string $until = null): array
    {
        $board = $this->decorateBoard($this->markets($user));

        return [
            'may_edit' => $this->mayEdit($user),
            'weeks' => $this->weekRange($from, self::WEEK_COUNT, $until),
            'markets' => $board['markets'],
            'summary' => $board['summary'],
            'general_statuses' => self::GENERAL_STATUSES,
            'mars_statuses' => self::MARS_STATUSES,
            'photo_max_bytes' => self::PHOTO_MAX_BYTES,
            'video_max_bytes' => self::VIDEO_MAX_BYTES,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function marketTree(User $user, int $jurisdictionId): array
    {
        $this->assertJurisdictionAccess($user, $jurisdictionId);

        $partnerRows = DB::table('partners as p')
            ->whereIn('p.ID', function ($query) use ($jurisdictionId) {
                $query->select('partner_ID')
                    ->from('venues')
                    ->where('jurisdiction_ID', $jurisdictionId)
                    ->whereNotNull('partner_ID')
                    ->union(
                        DB::table('partner_activities')
                            ->select('partner_ID')
                            ->where('jurisdiction_ID', $jurisdictionId)
                    );
            })
            ->orderBy('p.name')
            ->get(['p.ID', 'p.name', 'p.active']);

        $partners = [];
        foreach ($partnerRows as $row) {
            $partners[(int) $row->ID] = [
                'id' => (int) $row->ID,
                'name' => (string) $row->name,
                'active' => (int) $row->active === 1,
                'venues' => [],
            ];
        }

        $venueRows = DB::table('venues')
            ->where('jurisdiction_ID', $jurisdictionId)
            ->whereNotNull('partner_ID')
            ->orderBy('name')
            ->get(['ID', 'name', 'city', 'active', 'partner_ID', 'total_machines']);

        $venues = [];
        $venuesByPartner = [];
        $venueIds = [];
        foreach ($venueRows as $row) {
            $partnerId = (int) $row->partner_ID;
            if (! isset($partners[$partnerId])) {
                continue;
            }
            $venueId = (int) $row->ID;
            $venues[$venueId] = [
                'id' => $venueId,
                'name' => (string) $row->name,
                'city' => $row->city !== null ? (string) $row->city : null,
                'total_machines' => $row->total_machines !== null ? (int) $row->total_machines : null,
                'active' => (int) $row->active === 1,
                'games' => [],
            ];
            $venuesByPartner[$partnerId][] = $venueId;
            $venueIds[] = $venueId;
        }

        if ($venueIds !== []) {
            $gameRows = DB::table('field_trial_games as g')
                ->join('game_concepts as gc', 'gc.ID', '=', 'g.concept_ID')
                ->join('games as gm', 'gm.ID', '=', 'g.game_ID')
                ->join('platforms as plat', 'plat.ID', '=', 'gm.platform_ID')
                ->leftJoin('cabinets as cab', 'cab.ID', '=', 'g.cabinet_ID')
                ->whereIn('g.venue_ID', $venueIds)
                ->orderBy('gc.name')
                ->orderBy('g.ID')
                ->get([
                    'g.ID', 'g.venue_ID', 'g.concept_ID', 'gc.name as concept_name',
                    'g.game_ID', 'g.cabinet_ID', 'cab.name as cabinet_name',
                    'g.machine_count', 'g.trial_date', 'g.mod_date', 'g.general_status',
                    'g.status_update', 'g.mars_status', 'g.mars_status_update',
                    'g.info_data', 'g.remarks', 'plat.name as platform_name', 'gm.ID_text',
                ]);

            $mapped = [];
            foreach ($gameRows as $row) {
                $venueId = (int) $row->venue_ID;
                if (! isset($venues[$venueId])) {
                    continue;
                }
                $game = $this->mapGameRow((array) $row);
                $mapped[] = $game;
                $venues[$venueId]['games'][] = $game;
            }

            $timelines = $this->statusTimelines(array_column($mapped, 'id'));
            foreach ($venues as &$venue) {
                foreach ($venue['games'] as &$game) {
                    $game['timeline'] = $this->latestStatusMarkers($timelines[$game['id']] ?? [], $game);
                }
                unset($game);
            }
            unset($venue);
        }

        foreach ($partners as $partnerId => $partner) {
            foreach ($venuesByPartner[$partnerId] ?? [] as $venueId) {
                $partners[$partnerId]['venues'][] = $venues[$venueId];
            }
        }

        return array_values($partners);
    }

    /**
     * @return array<string, mixed>
     */
    public function options(User $user, int $jurisdictionId, ?int $partnerId): array
    {
        $this->assertJurisdictionAccess($user, $jurisdictionId);

        $concepts = DB::table('game_concepts')->orderBy('name')->get(['ID', 'name'])
            ->map(fn ($row) => ['id' => (int) $row->ID, 'name' => (string) $row->name])
            ->all();

        $games = DB::table('games as g')
            ->join('game_concepts as gc', 'gc.ID', '=', 'g.concept_ID')
            ->join('platforms as p', 'p.ID', '=', 'g.platform_ID')
            ->orderBy('gc.name')
            ->orderBy('p.name')
            ->orderBy('g.ID_text')
            ->get(['g.ID', 'g.concept_ID', 'gc.name as concept_name', 'p.name as platform_name', 'g.ID_text'])
            ->map(function ($row) {
                $code = trim((string) $row->ID_text);
                $label = $row->concept_name.' · '.$row->platform_name;
                if ($code !== '') {
                    $label .= ' ('.$code.')';
                }

                return [
                    'id' => (int) $row->ID,
                    'concept_id' => (int) $row->concept_ID,
                    'label' => $label,
                ];
            })
            ->all();

        $cabinets = DB::table('cabinets')->orderBy('name')->orderBy('code')->get(['ID', 'name', 'code', 'form_factor'])
            ->map(function ($row) {
                $parts = [trim((string) $row->name)];
                $code = trim((string) $row->code);
                if ($code !== '') {
                    $parts[] = $code;
                }
                $formFactor = trim((string) $row->form_factor);
                if ($formFactor !== '') {
                    $parts[] = $formFactor;
                }

                return [
                    'id' => (int) $row->ID,
                    'name' => (string) $row->name,
                    'label' => implode(' · ', $parts),
                ];
            })
            ->all();

        $partners = DB::table('partners')->where('active', 1)->orderBy('name')->get(['ID', 'name'])
            ->map(fn ($row) => ['id' => (int) $row->ID, 'name' => (string) $row->name])
            ->all();

        $venueQuery = DB::table('venues as v')
            ->leftJoin('partners as p', 'p.ID', '=', 'v.partner_ID')
            ->where('v.jurisdiction_ID', $jurisdictionId)
            ->orderBy('v.name');
        if ($partnerId !== null) {
            $venueQuery->where('v.partner_ID', $partnerId);
        }
        $venues = $venueQuery->get(['v.ID', 'v.name', 'v.city', 'v.partner_ID', 'p.name as partner_name'])
            ->map(function ($row) {
                $label = (string) $row->name;
                if (! empty($row->city)) {
                    $label .= ' ('.$row->city.')';
                }

                return [
                    'id' => (int) $row->ID,
                    'name' => (string) $row->name,
                    'label' => $label,
                    'city' => $row->city !== null ? (string) $row->city : null,
                    'partner_id' => $row->partner_ID !== null ? (int) $row->partner_ID : null,
                    'partner_name' => $row->partner_name !== null ? (string) $row->partner_name : null,
                ];
            })
            ->all();

        return [
            'concepts' => $concepts,
            'games' => $games,
            'cabinets' => $cabinets,
            'partners' => $partners,
            'venues' => $venues,
            'general_statuses' => self::GENERAL_STATUSES,
            'mars_statuses' => self::MARS_STATUSES,
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function saveGame(User $user, array $input): array
    {
        $this->requireEdit($user);
        $id = (int) ($input['id'] ?? 0);
        $venueId = $this->intParam($input['venue_id'] ?? null, 'location');
        $gameId = $this->intParam($input['game_id'] ?? null, 'game');
        $requestedConceptId = isset($input['concept_id']) && $input['concept_id'] !== ''
            ? $this->intParam($input['concept_id'], 'game system')
            : null;
        $cabinetId = isset($input['cabinet_id']) && $input['cabinet_id'] !== ''
            ? $this->intParam($input['cabinet_id'], 'cabinet type')
            : null;
        $machineCount = $this->requiredUnsigned($input['machine_count'] ?? null, 'the number of machines');
        $trialDate = $this->optionalDate($input['trial_date'] ?? null);
        $generalStatus = $this->statusOrNull($input['general_status'] ?? null, self::GENERAL_STATUSES);
        $marsStatus = $this->statusOrNull($input['mars_status'] ?? null, self::MARS_STATUSES);
        $statusUpdate = $this->optionalText($input['status_update'] ?? null, 4000);
        $marsStatusUpdate = $this->optionalText($input['mars_status_update'] ?? null, 4000);
        $infoData = $this->optionalText($input['info_data'] ?? null, 8000);
        $remarks = $this->optionalText($input['remarks'] ?? null, 8000);

        $game = DB::table('games')->where('ID', $gameId)->first(['ID', 'concept_ID']);
        if ($game === null) {
            throw new InvalidArgumentException('That game is not in the Games table.');
        }
        if ($requestedConceptId !== null) {
            $concept = DB::table('game_concepts')->where('ID', $requestedConceptId)->first(['ID']);
            if ($concept === null) {
                throw new InvalidArgumentException('That game system is not in the Game concepts table.');
            }
            $conceptId = $requestedConceptId;
        } else {
            $conceptId = (int) $game->concept_ID;
        }

        $venue = DB::table('venues')->where('ID', $venueId)->first(['ID', 'jurisdiction_ID']);
        if ($venue === null) {
            throw new InvalidArgumentException('That location is not in the Venues table.');
        }
        $this->assertJurisdictionAccess($user, (int) $venue->jurisdiction_ID);

        if ($cabinetId !== null && ! DB::table('cabinets')->where('ID', $cabinetId)->exists()) {
            throw new InvalidArgumentException('That cabinet type was not found.');
        }

        $values = [
            'venue_ID' => $venueId,
            'concept_ID' => $conceptId,
            'game_ID' => $gameId,
            'cabinet_ID' => $cabinetId,
            'machine_count' => $machineCount,
            'trial_date' => $trialDate,
            'general_status' => $generalStatus,
            'status_update' => $statusUpdate,
            'mars_status' => $marsStatus,
            'mars_status_update' => $marsStatusUpdate,
            'info_data' => $infoData,
            'remarks' => $remarks,
            'mod_by' => $user->ID,
        ];

        if ($id > 0) {
            $existing = DB::table('field_trial_games')->where('ID', $id)->first(['ID']);
            if ($existing === null) {
                throw new InvalidArgumentException('That field-trial game was not found.');
            }
            DB::table('field_trial_games')->where('ID', $id)->update($values);
            $this->snapshot($id, 'update');
        } else {
            $id = (int) DB::table('field_trial_games')->insertGetId($values);
            $this->snapshot($id, 'insert');
        }

        return $this->gameById($id);
    }

    public function deleteGame(User $user, int $id): void
    {
        $this->requireEdit($user);
        $row = DB::table('field_trial_games as g')
            ->join('venues as v', 'v.ID', '=', 'g.venue_ID')
            ->where('g.ID', $id)
            ->first(['g.ID', 'v.jurisdiction_ID']);
        if ($row === null) {
            throw new InvalidArgumentException('That field-trial game was not found.');
        }
        $this->assertJurisdictionAccess($user, (int) $row->jurisdiction_ID);
        $this->snapshot($id, 'delete');
        DB::table('field_trial_games')->where('ID', $id)->delete();
        $this->purgeMediaDirectory($id);
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function saveVenue(User $user, array $input): array
    {
        $this->requireEdit($user);
        $jurisdictionId = $this->intParam($input['jurisdiction_id'] ?? null, 'market');
        $partnerId = $this->intParam($input['partner_id'] ?? null, 'partner');
        $name = trim((string) ($input['name'] ?? ''));
        if ($name === '') {
            throw new InvalidArgumentException('Please give the venue a name.');
        }
        if (mb_strlen($name) > 100) {
            throw new InvalidArgumentException('Venue name is too long.');
        }
        $this->assertJurisdictionAccess($user, $jurisdictionId);

        $partner = DB::table('partners')->where('ID', $partnerId)->first(['ID', 'name']);
        if ($partner === null) {
            throw new InvalidArgumentException('That partner was not found.');
        }

        $city = $this->optionalText($input['city'] ?? null, 40);
        $street = $this->optionalText($input['street_address'] ?? null, 50);
        $province = $this->optionalText($input['province'] ?? null, 40);
        $postal = $this->optionalText($input['postal_code'] ?? null, 20);
        $totalMachines = null;
        $rawMachines = $input['total_machines'] ?? '';
        if ($rawMachines !== null && $rawMachines !== '') {
            if (! preg_match('/^\d+$/', (string) $rawMachines)) {
                throw new InvalidArgumentException('Total number of machines needs to be a whole number.');
            }
            $totalMachines = (int) $rawMachines;
            if ($totalMachines > 100000) {
                throw new InvalidArgumentException('Total number of machines is out of range.');
            }
        }

        $id = (int) DB::table('venues')->insertGetId([
            'mod_by' => $user->ID,
            'partner_ID' => $partnerId,
            'name' => $name,
            'jurisdiction_ID' => $jurisdictionId,
            'active' => 1,
            'street_address' => $street,
            'city' => $city,
            'province' => $province,
            'postal_code' => $postal,
            'total_machines' => $totalMachines,
        ]);

        return [
            'id' => $id,
            'name' => $name,
            'city' => $city,
            'active' => true,
            'partner_id' => $partnerId,
            'partner_name' => (string) $partner->name,
            'games' => [],
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function savePartner(User $user, array $input): array
    {
        $this->requireEdit($user);
        $jurisdictionId = $this->intParam($input['jurisdiction_id'] ?? null, 'market');
        $this->assertJurisdictionAccess($user, $jurisdictionId);

        $partnerId = isset($input['partner_id']) && $input['partner_id'] !== ''
            ? $this->intParam($input['partner_id'], 'partner')
            : 0;

        if ($partnerId > 0) {
            $partner = DB::table('partners')->where('ID', $partnerId)->first(['ID', 'name', 'active']);
            if ($partner === null) {
                throw new InvalidArgumentException('That partner was not found.');
            }
        } else {
            $name = trim((string) ($input['name'] ?? ''));
            if ($name === '') {
                throw new InvalidArgumentException('Please give the partner a name, or choose one that already exists.');
            }
            if (mb_strlen($name) > 100) {
                throw new InvalidArgumentException('Partner name is too long.');
            }
            $website = $this->optionalText($input['website'] ?? null, 50);
            $existing = DB::table('partners')->where('name', $name)->first(['ID', 'name', 'active']);
            if ($existing !== null) {
                $partner = $existing;
                $partnerId = (int) $existing->ID;
            } else {
                $partnerId = (int) DB::table('partners')->insertGetId([
                    'mod_by' => $user->ID,
                    'name' => $name,
                    'website' => $website,
                    'active' => 1,
                ]);
                $partner = (object) ['ID' => $partnerId, 'name' => $name, 'active' => 1];
            }
        }

        $already = DB::table('partner_activities')
            ->where('jurisdiction_ID', $jurisdictionId)
            ->where('partner_ID', $partnerId)
            ->exists();
        if (! $already) {
            DB::table('partner_activities')->insert([
                'mod_by' => $user->ID,
                'jurisdiction_ID' => $jurisdictionId,
                'partner_ID' => $partnerId,
                'key_customer' => 0,
            ]);
        }

        return [
            'id' => $partnerId,
            'name' => (string) $partner->name,
            'active' => (int) $partner->active === 1,
            'venues' => [],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function history(User $user, int $id): array
    {
        $row = DB::table('field_trial_games as g')
            ->join('venues as v', 'v.ID', '=', 'g.venue_ID')
            ->where('g.ID', $id)
            ->first(['g.ID', 'v.jurisdiction_ID']);
        if ($row === null) {
            throw new InvalidArgumentException('That field-trial game was not found.');
        }
        $this->assertJurisdictionAccess($user, (int) $row->jurisdiction_ID);

        $rows = DB::table('field_trial_games_history as h')
            ->leftJoin('dynamic__users as u', 'u.ID', '=', 'h.mod_by')
            ->where('h.ID', $id)
            ->orderBy('h.revision')
            ->get([
                'h.*',
                'u.firstname',
                'u.lastname',
            ]);

        $previous = null;
        $out = [];
        foreach ($rows as $revision) {
            $current = $this->historyValues($revision);
            $changes = [];
            foreach ($current as $field => $value) {
                $before = $previous[$field] ?? null;
                if ($previous === null || $before !== $value) {
                    $changes[] = [
                        'field' => $field,
                        'from' => $previous === null ? null : $before,
                        'to' => $value,
                    ];
                }
            }
            $name = trim(((string) ($revision->firstname ?? '')).' '.((string) ($revision->lastname ?? '')));
            $out[] = [
                'revision' => (int) $revision->revision,
                'action' => (string) $revision->action,
                'at' => $revision->mod_date !== null ? (string) $revision->mod_date : null,
                'editor' => $name !== '' ? $name : null,
                'changes' => $changes,
            ];
            $previous = $current;
        }

        return $out;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listMedia(User $user, int $gameId): array
    {
        $this->requireGameAccess($user, $gameId);
        $items = [];
        $seen = [];
        $root = $this->attachmentRoot();
        foreach ($this->mediaLevels($user) as $tlp) {
            foreach (['pictures', 'video'] as $assetClass) {
                $this->collectMediaFiles($root.'/'.$tlp.'/'.$gameId.'/~'.$assetClass, $seen, $items);
            }
        }
        $this->collectMediaFiles($this->legacyMediaDir($gameId), $seen, $items);
        $this->collectMediaFiles($this->mediaDir($gameId), $seen, $items, true);
        usort($items, static fn (array $a, array $b): int => strcasecmp((string) $a['name'], (string) $b['name']));

        return $items;
    }

    /**
     * @return array<string, mixed>
     */
    public function saveMedia(User $user, int $gameId, UploadedFile $file): array
    {
        $this->requireEdit($user);
        $this->requireGameAccess($user, $gameId);
        $originalName = (string) $file->getClientOriginalName();
        if (preg_match('/\.(heic|heif)$/i', $originalName) === 1) {
            throw new InvalidArgumentException('HEIC photos are not supported. Please upload JPG or PNG.');
        }
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: '');
        $kind = match ($extension) {
            'jpg', 'jpeg', 'png' => 'picture',
            'mp4' => 'video',
            default => '',
        };
        if ($kind === '') {
            throw new InvalidArgumentException('Pictures must be JPG or PNG, and video must be MP4.');
        }
        $limit = $kind === 'video' ? self::VIDEO_MAX_BYTES : self::PHOTO_MAX_BYTES;
        if ($file->getSize() > $limit) {
            throw new InvalidArgumentException($kind === 'video'
                ? 'That video is larger than 150 MB.'
                : 'That picture is larger than 15 MB.');
        }
        $display = basename(str_replace(["\0", '/', '\\'], '', $originalName));
        if ($display === '' || ! $this->mediaNameAllowed($display)) {
            $display = $kind === 'video' ? 'video.mp4' : ($extension === 'png' ? 'photo.png' : 'photo.jpg');
        }
        $dir = $this->legacyMediaDir($gameId);
        if (! is_dir($dir) && ! mkdir($dir, 0775, true) && ! is_dir($dir)) {
            throw new InvalidArgumentException('The upload folder could not be created.');
        }
        $stored = $user->ID.'~'.time().'~'.bin2hex(random_bytes(3)).'~~'.$display;
        if (! $this->mediaNameAllowed($stored)) {
            $display = $kind === 'video' ? 'video.mp4' : ($extension === 'png' ? 'photo.png' : 'photo.jpg');
            $stored = $user->ID.'~'.time().'~'.bin2hex(random_bytes(3)).'~~'.$display;
        }
        $file->move($dir, $stored);

        return $this->mediaItem($stored, $kind, $dir.DIRECTORY_SEPARATOR.$stored);
    }

    public function deleteMedia(User $user, int $gameId, string $fileId): void
    {
        $this->requireEdit($user);
        $this->requireGameAccess($user, $gameId);
        $path = $this->mediaPath($gameId, $fileId, $user);
        if ($path === null || ! is_file($path)) {
            throw new InvalidArgumentException('That file was not found.');
        }
        unlink($path);
    }

    public function mediaPathFor(User $user, int $gameId, string $fileId): string
    {
        $this->requireGameAccess($user, $gameId);
        $path = $this->mediaPath($gameId, $fileId, $user);
        if ($path === null || ! is_file($path)) {
            throw new InvalidArgumentException('That file was not found.');
        }

        return $path;
    }

    /**
     * @return array<string, mixed>
     */
    public function weekRange(?string $from, int $count = self::WEEK_COUNT, ?string $until = null): array
    {
        if (is_string($from) && preg_match('/^(\d{4})-W(\d{2})$/', $from, $match) === 1) {
            $year = (int) $match[1];
            $week = (int) $match[2];
            if ($week < 1 || $week > 53) {
                throw new InvalidArgumentException('That calendar week is not valid.');
            }
        } else {
            $today = new DateTimeImmutable('today');
            $start = $today->setISODate((int) $today->format('o'), (int) $today->format('W'))->modify('-4 weeks');
            $year = (int) $start->format('o');
            $week = (int) $start->format('W');
        }

        $cursor = (new DateTimeImmutable('today'))->setISODate($year, $week);
        $today = new DateTimeImmutable('today');
        $currentYear = (int) $today->format('o');
        $currentWeek = (int) $today->format('W');
        $limited = false;
        $untilDate = $this->boardDate($until);
        if ($untilDate !== null) {
            $endMonday = $untilDate->setISODate((int) $untilDate->format('o'), (int) $untilDate->format('W'));
            if ($endMonday < $cursor) {
                throw new InvalidArgumentException('The end date needs to be on or after the start date.');
            }
            $count = intdiv((int) $cursor->diff($endMonday)->days, 7) + 1;
            if ($count > self::MAX_RANGE_WEEKS) {
                $count = self::MAX_RANGE_WEEKS;
                $limited = true;
            }
        }
        $weeks = [];
        for ($i = 0; $i < $count; $i++) {
            $isoYear = (int) $cursor->format('o');
            $isoWeek = (int) $cursor->format('W');
            $end = $cursor->modify('+6 days');
            $isCurrent = $isoYear === $currentYear && $isoWeek === $currentWeek;
            $weeks[] = [
                'year' => $isoYear,
                'week' => $isoWeek,
                'start' => $cursor->format('Y-m-d'),
                'end' => $end->format('Y-m-d'),
                'current' => $isCurrent,
                'past' => $end < $today && ! $isCurrent,
            ];
            $cursor = $cursor->modify('+1 week');
        }

        $prev = (new DateTimeImmutable('today'))->setISODate($year, $week)->modify('-4 weeks');
        $next = (new DateTimeImmutable('today'))->setISODate($year, $week)->modify('+4 weeks');

        return [
            'from' => sprintf('%04d-W%02d', $year, $week),
            'prev' => sprintf('%04d-W%02d', (int) $prev->format('o'), (int) $prev->format('W')),
            'next' => sprintf('%04d-W%02d', (int) $next->format('o'), (int) $next->format('W')),
            'today' => sprintf('%04d-W%02d', $currentYear, $currentWeek),
            'until' => $untilDate?->format('Y-m-d'),
            'limited' => $limited,
            'weeks' => $weeks,
        ];
    }

    private function boardDate(?string $value): ?DateTimeImmutable
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) !== 1) {
            throw new InvalidArgumentException('That date is not valid.');
        }
        $date = DateTimeImmutable::createFromFormat('Y-m-d', $value);
        if ($date === false || $date->format('Y-m-d') !== $value) {
            throw new InvalidArgumentException('That date is not valid.');
        }

        return $date;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function markets(User $user): array
    {
        $allowed = $this->accessibleJurisdictionIds($user);
        $landbased = DB::table('markets_landbased as ML')
            ->join('jurisdictions as J', 'J.ID', '=', 'ML.jurisdiction_ID')
            ->selectRaw("'land-based' as source, ML.ID as market_id, J.ID as jurisdiction_id, J.flag, J.name_english, J.iso3166, J.segment, J.segment_name");
        $online = DB::table('markets_online as MO')
            ->join('jurisdictions as J', 'J.ID', '=', 'MO.jurisdiction_ID')
            ->selectRaw("'online' as source, MO.ID as market_id, J.ID as jurisdiction_id, J.flag, J.name_english, J.iso3166, J.segment, J.segment_name");
        if ($allowed !== null) {
            $landbased->whereIn('J.ID', $allowed);
            $online->whereIn('J.ID', $allowed);
        }
        $rows = $landbased->unionAll($online)->orderBy('name_english')->get();

        $markets = [];
        foreach ($rows as $row) {
            $markets[] = [
                'source' => (string) $row->source,
                'market_id' => (int) $row->market_id,
                'jurisdiction_id' => (int) $row->jurisdiction_id,
                'flag' => (string) $row->flag,
                'name' => (string) $row->name_english,
                'iso3166' => (string) $row->iso3166,
                'segment' => (string) $row->segment,
                'segment_name' => (string) $row->segment_name,
                'partner_count' => 0,
                'venue_count' => 0,
                'game_count' => 0,
            ];
        }
        if ($markets === []) {
            return $markets;
        }

        $partnerIds = [];
        $links = DB::table('venues')->whereNotNull('partner_ID')->select('jurisdiction_ID', 'partner_ID')
            ->union(DB::table('partner_activities')->select('jurisdiction_ID', 'partner_ID'))
            ->get();
        foreach ($links as $link) {
            $partnerIds[(int) $link->jurisdiction_ID][(int) $link->partner_ID] = true;
        }

        $venueCounts = DB::table('venues')
            ->selectRaw('jurisdiction_ID, COUNT(*) as n')
            ->groupBy('jurisdiction_ID')
            ->pluck('n', 'jurisdiction_ID');
        $gameCounts = DB::table('field_trial_games as g')
            ->join('venues as v', 'v.ID', '=', 'g.venue_ID')
            ->selectRaw('v.jurisdiction_ID, COUNT(g.ID) as n')
            ->groupBy('v.jurisdiction_ID')
            ->pluck('n', 'jurisdiction_ID');

        foreach ($markets as &$market) {
            $id = $market['jurisdiction_id'];
            $market['partner_count'] = isset($partnerIds[$id]) ? count($partnerIds[$id]) : 0;
            $market['venue_count'] = (int) ($venueCounts[$id] ?? 0);
            $market['game_count'] = (int) ($gameCounts[$id] ?? 0);
        }
        unset($market);

        return $markets;
    }

    /**
     * Adds collapsed-row timeline bars, search text, and the summary cards.
     *
     * @param  list<array<string, mixed>>  $markets
     * @return array{markets: list<array<string, mixed>>, summary: array{active_trials:int,markets:int,games:int,issues:int}}
     */
    private function decorateBoard(array $markets): array
    {
        $summary = [
            'active_trials' => 0,
            'markets' => 0,
            'games' => 0,
            'issues' => 0,
        ];
        $ids = array_values(array_unique(array_map(static fn (array $market): int => (int) $market['jurisdiction_id'], $markets)));
        $search = [];
        $gamesByJurisdiction = [];
        foreach ($ids as $id) {
            $search[$id] = [];
            $gamesByJurisdiction[$id] = [];
        }

        if ($ids !== []) {
            $places = DB::table('venues as v')
                ->leftJoin('partners as p', 'p.ID', '=', 'v.partner_ID')
                ->whereIn('v.jurisdiction_ID', $ids)
                ->get(['v.jurisdiction_ID', 'v.name as venue_name', 'v.city', 'p.name as partner_name']);
            foreach ($places as $place) {
                $id = (int) $place->jurisdiction_ID;
                foreach ([$place->partner_name, $place->venue_name, $place->city] as $part) {
                    $part = trim((string) $part);
                    if ($part !== '') {
                        $search[$id][] = $part;
                    }
                }
            }

            $rows = DB::table('field_trial_games as g')
                ->join('venues as v', 'v.ID', '=', 'g.venue_ID')
                ->join('game_concepts as gc', 'gc.ID', '=', 'g.concept_ID')
                ->whereIn('v.jurisdiction_ID', $ids)
                ->get([
                    'g.ID', 'g.general_status', 'g.mars_status', 'g.trial_date', 'g.mod_date',
                    'v.jurisdiction_ID', 'gc.name as concept_name',
                ]);
            $mapped = [];
            foreach ($rows as $row) {
                $trialDate = $row->trial_date !== null && $row->trial_date !== ''
                    ? substr((string) $row->trial_date, 0, 10)
                    : null;
                [$isoYear, $isoWeek] = $this->isoWeekParts($trialDate);
                $jurisdictionId = (int) $row->jurisdiction_ID;
                $concept = trim((string) $row->concept_name);
                if ($concept !== '') {
                    $search[$jurisdictionId][] = $concept;
                }
                $mapped[] = [
                    'id' => (int) $row->ID,
                    'jurisdiction_id' => $jurisdictionId,
                    'general_status' => $row->general_status !== null ? (string) $row->general_status : null,
                    'mars_status' => $row->mars_status !== null ? (string) $row->mars_status : null,
                    'timeline' => $this->fallbackTimeline($row->general_status, $trialDate, $isoYear, $isoWeek),
                ];
            }
            $timelines = $this->statusTimelines(array_column($mapped, 'id'));
            foreach ($mapped as $game) {
                $game['timeline'] = $this->latestStatusMarkers($timelines[$game['id']] ?? [], $game);
                $gamesByJurisdiction[$game['jurisdiction_id']][] = $game;
            }
        }

        $counted = [];
        foreach ($markets as &$market) {
            $id = (int) $market['jurisdiction_id'];
            $games = $gamesByJurisdiction[$id] ?? [];
            $rolled = $this->rollBars($games);
            $market['bars'] = $rolled['bars'];
            $market['issue_count'] = $rolled['issue_count'];
            $market['issue_year'] = $rolled['issue_year'];
            $market['issue_week'] = $rolled['issue_week'];
            $market['statuses'] = $rolled['statuses'];
            $market['search'] = implode(' ', array_unique($search[$id] ?? []));
            if (isset($counted[$id]) || $games === []) {
                continue;
            }
            $counted[$id] = true;
            $summary['markets']++;
            foreach ($games as $game) {
                $summary['games']++;
                $status = strtolower(trim((string) ($game['general_status'] ?? '')));
                if (in_array($status, ['planned', 'expected', 'go live', 'performance', 'replacement plan'], true)) {
                    $summary['active_trials']++;
                }
                if ($this->gameHasIssue($game)) {
                    $summary['issues']++;
                }
            }
        }
        unset($market);

        return ['markets' => $markets, 'summary' => $summary];
    }

    /**
     * @param  list<array<string, mixed>>  $games
     * @return array{bars: list<array<string, mixed>>, issue_count: int, issue_year: int|null, issue_week: int|null, statuses: list<string>}
     */
    private function rollBars(array $games): array
    {
        $groups = [];
        $statuses = [];
        $issueCount = 0;
        $issueYear = null;
        $issueWeek = null;
        foreach ($games as $game) {
            $current = trim((string) ($game['general_status'] ?? ''));
            if ($current !== '') {
                $statuses[$current] = true;
            }
            if ($this->gameHasIssue($game)) {
                $issueCount++;
                $point = $this->issuePoint($game);
                if ($point !== null && ($issueYear === null || $this->weekStamp((int) $point['iso_year'], (int) $point['iso_week']) >= $this->weekStamp((int) $issueYear, (int) $issueWeek))) {
                    $issueYear = (int) $point['iso_year'];
                    $issueWeek = (int) $point['iso_week'];
                }
            }
            $seen = [];
            foreach ($this->spansForGame($game) as $span) {
                $status = (string) $span['status'];
                if ($this->isIssueStatus($status)) {
                    continue;
                }
                $statuses[$status] = true;
                $key = strtolower($status);
                if (isset($seen[$key])) {
                    continue;
                }
                $seen[$key] = true;
                if (! isset($groups[$key])) {
                    $groups[$key] = $span;
                    $groups[$key]['count'] = 0;
                }
                if ($this->weekStamp($span['from_year'], $span['from_week']) < $this->weekStamp($groups[$key]['from_year'], $groups[$key]['from_week'])) {
                    $groups[$key]['from_year'] = $span['from_year'];
                    $groups[$key]['from_week'] = $span['from_week'];
                }
                if ($this->weekStamp($span['to_year'], $span['to_week']) > $this->weekStamp($groups[$key]['to_year'], $groups[$key]['to_week'])) {
                    $groups[$key]['to_year'] = $span['to_year'];
                    $groups[$key]['to_week'] = $span['to_week'];
                }
                $groups[$key]['count']++;
            }
        }
        $bars = array_values($groups);
        usort($bars, fn (array $a, array $b): int => $this->weekStamp($a['from_year'], $a['from_week']) <=> $this->weekStamp($b['from_year'], $b['from_week']));

        return [
            'bars' => $bars,
            'issue_count' => $issueCount,
            'issue_year' => $issueYear,
            'issue_week' => $issueWeek,
            'statuses' => array_keys($statuses),
        ];
    }

    /**
     * Each status runs from the week it started until the next status, or through the current week when it is still open.
     *
     * @param  array<string, mixed>  $game
     * @return list<array{status:string,from_year:int,from_week:int,to_year:int,to_week:int}>
     */
    private function spansForGame(array $game): array
    {
        $points = $game['timeline'] ?? [];
        usort($points, static fn (array $a, array $b): int => [$a['iso_year'], $a['iso_week']] <=> [$b['iso_year'], $b['iso_week']]);
        $today = new DateTimeImmutable('today');
        $currentYear = (int) $today->format('o');
        $currentWeek = (int) $today->format('W');
        $spans = [];
        $count = count($points);
        for ($i = 0; $i < $count; $i++) {
            $status = (string) $points[$i]['status'];
            $fromYear = (int) $points[$i]['iso_year'];
            $fromWeek = (int) $points[$i]['iso_week'];
            $toYear = $fromYear;
            $toWeek = $fromWeek;
            if ($i + 1 < $count) {
                $next = (new DateTimeImmutable('today'))
                    ->setISODate((int) $points[$i + 1]['iso_year'], (int) $points[$i + 1]['iso_week'])
                    ->modify('-1 week');
                $toYear = (int) $next->format('o');
                $toWeek = (int) $next->format('W');
                if ($this->weekStamp($toYear, $toWeek) < $this->weekStamp($fromYear, $fromWeek)) {
                    $toYear = $fromYear;
                    $toWeek = $fromWeek;
                }
            } elseif (! $this->isTerminalStatus($status) && ! $this->isIssueStatus($status) && $this->weekStamp($fromYear, $fromWeek) <= $this->weekStamp($currentYear, $currentWeek)) {
                $toYear = $currentYear;
                $toWeek = $currentWeek;
            }
            $spans[] = [
                'status' => $status,
                'from_year' => $fromYear,
                'from_week' => $fromWeek,
                'to_year' => $toYear,
                'to_week' => $toWeek,
            ];
        }

        return $spans;
    }

    /**
     * @param  array<string, mixed>  $game
     * @return array<string, mixed>|null
     */
    private function issuePoint(array $game): ?array
    {
        foreach ($game['timeline'] ?? [] as $point) {
            if ($this->isIssueStatus((string) ($point['status'] ?? ''))) {
                return $point;
            }
        }
        foreach ($game['timeline'] ?? [] as $point) {
            return $point;
        }

        return null;
    }

    private function gameHasIssue(array $game): bool
    {
        return $this->isIssueStatus(isset($game['general_status']) ? (string) $game['general_status'] : null)
            || $this->isIssueStatus(isset($game['mars_status']) ? (string) $game['mars_status'] : null);
    }

    private function isIssueStatus(?string $status): bool
    {
        $status = strtolower(trim((string) $status));

        return $status !== '' && str_contains($status, 'issue');
    }

    private function isTerminalStatus(string $status): bool
    {
        $status = strtolower($status);

        return str_contains($status, 'replaced') || str_contains($status, 'end');
    }

    private function weekStamp(int $year, int $week): int
    {
        return $year * 100 + $week;
    }

    /**
     * @return array<string, mixed>
     */
    private function gameById(int $id): array
    {
        $row = DB::table('field_trial_games as g')
            ->join('game_concepts as gc', 'gc.ID', '=', 'g.concept_ID')
            ->join('games as gm', 'gm.ID', '=', 'g.game_ID')
            ->join('platforms as plat', 'plat.ID', '=', 'gm.platform_ID')
            ->leftJoin('cabinets as cab', 'cab.ID', '=', 'g.cabinet_ID')
            ->where('g.ID', $id)
            ->first([
                'g.ID', 'g.venue_ID', 'g.concept_ID', 'gc.name as concept_name',
                'g.game_ID', 'g.cabinet_ID', 'cab.name as cabinet_name',
                'g.machine_count', 'g.trial_date', 'g.mod_date', 'g.general_status',
                'g.status_update', 'g.mars_status', 'g.mars_status_update',
                'g.info_data', 'g.remarks', 'plat.name as platform_name', 'gm.ID_text',
            ]);
        if ($row === null) {
            throw new InvalidArgumentException('That field-trial game was not found.');
        }
        $game = $this->mapGameRow((array) $row);
        $timelines = $this->statusTimelines([$id]);
        $game['timeline'] = $this->latestStatusMarkers($timelines[$id] ?? [], $game);

        return $game;
    }

    private function snapshot(int $id, string $action): void
    {
        $row = DB::table('field_trial_games')->where('ID', $id)->first();
        if ($row === null) {
            return;
        }
        DB::table('field_trial_games_history')->insert([
            'action' => $action,
            'ID' => $id,
            'mod_date' => $row->mod_date,
            'mod_by' => $row->mod_by,
            'venue_ID' => $row->venue_ID,
            'concept_ID' => $row->concept_ID,
            'game_ID' => $row->game_ID,
            'cabinet_ID' => $row->cabinet_ID,
            'machine_count' => $row->machine_count,
            'trial_date' => $row->trial_date,
            'general_status' => $row->general_status,
            'status_update' => $row->status_update,
            'mars_status' => $row->mars_status,
            'mars_status_update' => $row->mars_status_update,
            'info_data' => $row->info_data,
            'remarks' => $row->remarks,
        ]);
    }

    /**
     * @return array<string, string|null>
     */
    private function historyValues(object $row): array
    {
        return [
            'location' => $this->lookupName('venues', $row->venue_ID),
            'game_system' => $this->lookupName('game_concepts', $row->concept_ID),
            'game' => $this->gameLabel($row->game_ID),
            'cabinet' => $row->cabinet_ID !== null ? $this->lookupName('cabinets', $row->cabinet_ID) : null,
            'machines' => $row->machine_count !== null ? (string) $row->machine_count : null,
            'status_date' => $row->trial_date !== null ? (string) $row->trial_date : null,
            'general_status' => $row->general_status !== null ? (string) $row->general_status : null,
            'status_update' => $row->status_update !== null ? (string) $row->status_update : null,
            'mars_status' => $row->mars_status !== null ? (string) $row->mars_status : null,
            'mars_status_update' => $row->mars_status_update !== null ? (string) $row->mars_status_update : null,
            'info' => $row->info_data !== null ? (string) $row->info_data : null,
            'remarks' => $row->remarks !== null ? (string) $row->remarks : null,
        ];
    }

    private function lookupName(string $table, mixed $id): ?string
    {
        if ($id === null) {
            return null;
        }
        $name = DB::table($table)->where('ID', $id)->value('name');

        return $name !== null ? (string) $name : null;
    }

    private function gameLabel(mixed $id): ?string
    {
        if ($id === null) {
            return null;
        }
        $row = DB::table('games as g')
            ->join('game_concepts as gc', 'gc.ID', '=', 'g.concept_ID')
            ->join('platforms as p', 'p.ID', '=', 'g.platform_ID')
            ->where('g.ID', $id)
            ->first(['gc.name as concept_name', 'p.name as platform_name', 'g.ID_text']);
        if ($row === null) {
            return null;
        }
        $code = trim((string) $row->ID_text);
        $label = $row->concept_name.' · '.$row->platform_name;

        return $code !== '' ? $label.' ('.$code.')' : $label;
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function mapGameRow(array $row): array
    {
        [$isoYear, $isoWeek] = $this->isoWeekParts($row['trial_date'] ?? null);
        $code = trim((string) ($row['ID_text'] ?? ''));
        $label = $row['concept_name'].' · '.$row['platform_name'];
        if ($code !== '') {
            $label .= ' ('.$code.')';
        }
        $trialDate = $row['trial_date'] !== null ? substr((string) $row['trial_date'], 0, 10) : null;

        return [
            'id' => (int) $row['ID'],
            'venue_id' => (int) $row['venue_ID'],
            'concept_id' => (int) $row['concept_ID'],
            'concept_name' => (string) $row['concept_name'],
            'game_id' => (int) $row['game_ID'],
            'game_label' => $label,
            'cabinet_id' => $row['cabinet_ID'] !== null ? (int) $row['cabinet_ID'] : null,
            'cabinet_name' => $row['cabinet_name'] !== null ? (string) $row['cabinet_name'] : null,
            'machine_count' => $row['machine_count'] !== null ? (int) $row['machine_count'] : null,
            'trial_date' => $trialDate,
            'mod_date' => isset($row['mod_date']) ? substr((string) $row['mod_date'], 0, 10) : null,
            'iso_year' => $isoYear,
            'iso_week' => $isoWeek,
            'general_status' => $row['general_status'],
            'status_update' => $row['status_update'],
            'mars_status' => $row['mars_status'],
            'mars_status_update' => $row['mars_status_update'],
            'info_data' => $row['info_data'] ?? null,
            'remarks' => $row['remarks'] ?? null,
            'timeline' => $this->fallbackTimeline($row['general_status'] ?? null, $trialDate, $isoYear, $isoWeek),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function fallbackTimeline(mixed $status, ?string $date, ?int $isoYear, ?int $isoWeek): array
    {
        $point = $this->statusPoint(is_string($status) ? $status : '', $date, $isoYear, $isoWeek);

        return $point === null ? [] : [$point];
    }

    /**
     * @param  list<array<string, mixed>>  $history
     * @param  array<string, mixed>  $game
     * @return list<array<string, mixed>>
     */
    private function latestStatusMarkers(array $history, array $game): array
    {
        $byStatus = [];
        foreach ($history as $point) {
            $status = trim((string) ($point['status'] ?? ''));
            if ($status === '' || empty($point['iso_year']) || empty($point['iso_week'])) {
                continue;
            }
            $byStatus[$status] = $point;
        }
        foreach ($game['timeline'] as $point) {
            $byStatus[$point['status']] = $point;
        }
        $timeline = array_values($byStatus);
        usort($timeline, static fn (array $a, array $b): int => [$a['iso_year'], $a['iso_week']] <=> [$b['iso_year'], $b['iso_week']]);

        return $timeline;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function statusPoint(string $status, ?string $date, ?int $isoYear = null, ?int $isoWeek = null): ?array
    {
        $status = trim($status);
        $date = is_string($date) && $date !== '' ? $date : null;
        if ($status === '' && $date === null) {
            return null;
        }
        if ($isoYear === null && $date !== null) {
            [$isoYear, $isoWeek] = $this->isoWeekParts($date);
        }
        if ($status === '' || $isoYear === null || $isoWeek === null) {
            return null;
        }

        return [
            'status' => $status,
            'from' => $date,
            'iso_year' => $isoYear,
            'iso_week' => $isoWeek,
        ];
    }

    /**
     * @param  list<int>  $gameIds
     * @return array<int, list<array<string, mixed>>>
     */
    private function statusTimelines(array $gameIds): array
    {
        if ($gameIds === []) {
            return [];
        }
        $rows = DB::table('field_trial_games_history')
            ->whereIn('ID', $gameIds)
            ->orderBy('ID')
            ->orderBy('revision')
            ->get(['ID', 'revision', 'trial_date', 'general_status', 'mod_date']);
        $byGame = [];
        foreach ($rows as $row) {
            $byGame[(int) $row->ID][] = $row;
        }
        $out = [];
        foreach ($byGame as $id => $historyRows) {
            $byStatus = [];
            foreach ($historyRows as $row) {
                $trialDate = $row->trial_date !== null && $row->trial_date !== ''
                    ? substr((string) $row->trial_date, 0, 10)
                    : null;
                $date = $trialDate ?? substr((string) $row->mod_date, 0, 10);
                $point = $this->statusPoint((string) ($row->general_status ?? ''), $date);
                if ($point === null) {
                    continue;
                }
                $byStatus[$point['status']] = $point;
            }
            $out[$id] = array_values($byStatus);
        }

        return $out;
    }

    /**
     * @return array{0: int|null, 1: int|null}
     */
    private function isoWeekParts(mixed $date): array
    {
        if (! is_string($date) || $date === '') {
            return [null, null];
        }
        $date = substr($date, 0, 10);
        $dt = DateTimeImmutable::createFromFormat('Y-m-d', $date);
        if ($dt === false) {
            return [null, null];
        }

        return [(int) $dt->format('o'), (int) $dt->format('W')];
    }

    /**
     * @return list<int>|null
     */
    private function accessibleJurisdictionIds(User $user): ?array
    {
        if ($user->role?->canAccessUnsubscribedMarkets()) {
            return null;
        }

        return DB::table('stakes_jurisdictions')
            ->where('person_ID', $user->ID)
            ->pluck('jurisdiction_ID')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function assertJurisdictionAccess(User $user, int $jurisdictionId): void
    {
        $allowed = $this->accessibleJurisdictionIds($user);
        if ($allowed === null || in_array($jurisdictionId, $allowed, true)) {
            return;
        }
        throw new InvalidArgumentException('You cannot work in that market.');
    }

    private function requireEdit(User $user): void
    {
        if (! $this->mayEdit($user)) {
            throw new InvalidArgumentException('You can look at Field Trials, but you cannot change them.');
        }
    }

    private function requireGameAccess(User $user, int $id): void
    {
        $row = DB::table('field_trial_games as g')
            ->join('venues as v', 'v.ID', '=', 'g.venue_ID')
            ->where('g.ID', $id)
            ->first(['v.jurisdiction_ID']);
        if ($row === null) {
            throw new InvalidArgumentException('That field-trial game was not found.');
        }
        $this->assertJurisdictionAccess($user, (int) $row->jurisdiction_ID);
    }

    private function intParam(mixed $value, string $label): int
    {
        if ($value === null || $value === '' || ! preg_match('/^\d+$/', (string) $value)) {
            throw new InvalidArgumentException("Please choose a {$label}.");
        }
        $id = (int) $value;
        if ($id < 1) {
            throw new InvalidArgumentException("Please choose a {$label}.");
        }

        return $id;
    }

    private function requiredUnsigned(mixed $value, string $label): int
    {
        if ($value === null || $value === '') {
            throw new InvalidArgumentException("Please enter {$label}.");
        }
        if (! preg_match('/^\d+$/', (string) $value)) {
            throw new InvalidArgumentException("{$label} needs to be a whole number.");
        }
        $n = (int) $value;
        if ($n < 1 || $n > 100000) {
            throw new InvalidArgumentException("{$label} is out of range.");
        }

        return $n;
    }

    private function optionalDate(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        $value = (string) $value;
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) !== 1) {
            throw new InvalidArgumentException('Date needs to be YYYY-MM-DD.');
        }
        $dt = DateTimeImmutable::createFromFormat('Y-m-d', $value);
        if ($dt === false || $dt->format('Y-m-d') !== $value) {
            throw new InvalidArgumentException('That date is not valid.');
        }

        return $value;
    }

    private function optionalText(mixed $value, int $max): ?string
    {
        if ($value === null) {
            return null;
        }
        $text = trim((string) $value);
        if ($text === '') {
            return null;
        }
        if (mb_strlen($text) > $max) {
            throw new InvalidArgumentException('That text is too long.');
        }

        return $text;
    }

    /**
     * @param  list<string>  $allowed
     */
    private function statusOrNull(mixed $value, array $allowed): ?string
    {
        $text = $this->optionalText($value, 80);
        if ($text === null) {
            return null;
        }
        if (! in_array($text, $allowed, true)) {
            throw new InvalidArgumentException('That status is not one of the field-trial statuses.');
        }

        return $text;
    }

    private function mediaDir(int $gameId): string
    {
        return storage_path('app/field-trials/'.$gameId);
    }

    private function attachmentRoot(): string
    {
        return rtrim((string) config('merkur.assets_path'), '/').'/field_trial_games';
    }

    private function legacyMediaDir(int $gameId): string
    {
        return $this->attachmentRoot().'/'.$gameId;
    }

    /**
     * @return list<string>
     */
    private function mediaLevels(User $user): array
    {
        $user->loadMissing('role');
        $levels = ['clear', 'green', 'amber'];
        if ($user->canUseTlpRed()) {
            $levels[] = 'red';
        }

        return $levels;
    }

    private function mediaNameAllowed(string $name): bool
    {
        return $name !== ''
            && ! str_contains($name, '/')
            && ! str_contains($name, '\\')
            && ! str_contains($name, '..')
            && ! str_ends_with(strtolower($name), '.json');
    }

    private function mediaKind(string $name): string
    {
        return match (strtolower(pathinfo($name, PATHINFO_EXTENSION))) {
            'jpg', 'jpeg', 'png' => 'picture',
            'mp4', 'mov', 'm4v', 'webm' => 'video',
            default => '',
        };
    }

    /**
     * @param  array<string, true>  $seen
     * @param  list<array<string, mixed>>  $items
     */
    private function collectMediaFiles(string $dir, array &$seen, array &$items, bool $hexNames = false): void
    {
        if (! is_dir($dir)) {
            return;
        }
        foreach (scandir($dir) ?: [] as $name) {
            if (! $this->mediaNameAllowed($name) || isset($seen[$name]) || ! is_file($dir.DIRECTORY_SEPARATOR.$name)) {
                continue;
            }
            $kind = $this->mediaKind($name);
            if ($kind === '') {
                continue;
            }
            $seen[$name] = true;
            $file = $hexNames ? (string) pathinfo($name, PATHINFO_FILENAME) : $name;
            $items[] = $this->mediaItem($file, $kind, $dir.DIRECTORY_SEPARATOR.$name, $name);
        }
    }

    /**
     * @return array{file:string,name:string,kind:string,bytes:int}
     */
    private function mediaItem(string $file, string $kind, string $path, ?string $storedName = null): array
    {
        $storedName ??= $file;
        $display = $storedName;
        if (preg_match('/~~(.+)$/', $storedName, $match) === 1) {
            $display = $match[1];
        }

        return [
            'file' => $file,
            'name' => $display,
            'kind' => $kind,
            'bytes' => is_file($path) ? (filesize($path) ?: 0) : 0,
        ];
    }

    private function mediaPath(int $gameId, string $fileId, ?User $user = null): ?string
    {
        if (! $this->mediaNameAllowed($fileId)) {
            return null;
        }
        if (preg_match('/^[a-f0-9]{16}$/', $fileId) === 1) {
            $dir = $this->mediaDir($gameId);
            foreach (['jpg', 'jpeg', 'png', 'mp4', 'mov', 'm4v', 'webm'] as $extension) {
                $path = $dir.DIRECTORY_SEPARATOR.$fileId.'.'.$extension;
                if (is_file($path)) {
                    return $path;
                }
            }
        }
        $legacy = $this->legacyMediaDir($gameId).DIRECTORY_SEPARATOR.$fileId;
        if (is_file($legacy)) {
            return $legacy;
        }
        $levels = $user !== null ? $this->mediaLevels($user) : ['clear', 'green', 'amber'];
        foreach ($levels as $tlp) {
            foreach (['pictures', 'video'] as $assetClass) {
                $path = $this->attachmentRoot().'/'.$tlp.'/'.$gameId.'/~'.$assetClass.DIRECTORY_SEPARATOR.$fileId;
                if (is_file($path)) {
                    return $path;
                }
            }
        }

        return null;
    }

    private function purgeMediaDirectory(int $gameId): void
    {
        $this->removeMediaDir($this->mediaDir($gameId));
        $this->removeMediaDir($this->legacyMediaDir($gameId));
        foreach (['clear', 'green', 'amber', 'red'] as $tlp) {
            $this->removeMediaDir($this->attachmentRoot().'/'.$tlp.'/'.$gameId);
        }
    }

    private function removeMediaDir(string $dir): void
    {
        if (! is_dir($dir)) {
            return;
        }
        $items = scandir($dir) ?: [];
        foreach ($items as $name) {
            if ($name === '.' || $name === '..') {
                continue;
            }
            $path = $dir.DIRECTORY_SEPARATOR.$name;
            if (is_dir($path)) {
                $this->removeMediaDir($path);
            } elseif (is_file($path)) {
                unlink($path);
            }
        }
        @rmdir($dir);
    }
}
