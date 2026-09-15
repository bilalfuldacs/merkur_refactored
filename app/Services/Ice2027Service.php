<?php

namespace App\Services;

use App\Models\Ice2027Competitor;
use App\Models\Ice2027Evaluation;
use App\Models\Ice2027Game;
use App\Models\Ice2027Questionnaire;
use App\Models\Ice2027Team;
use App\Models\Ice2027TeamMember;
use App\Models\ScoutAttendant;
use App\Models\ScoutEvent;
use App\Models\ScoutQuestionnaire;
use App\Models\ScoutQuestionnaireHistory;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use InvalidArgumentException;
use RuntimeException;

class Ice2027Service
{
    public const MAX_TEAMS = 5;

    public const MEMBERS_PER_TEAM = 2;

    public const COMPETITORS_PER_TEAM = 3;

    public const EVAL_REQUIRED_ROWS = 5;

    public const WOULD_PLAY = ['yes', 'no', 'unsure'];

    private ?int $eventId = null;

    public const GAME_TYPES = [
        'new_product' => 'New product',
        'mlp' => 'MLP',
        'sap' => 'SAP',
        'multigame' => 'Multigame',
        'cabinet' => 'Cabinet',
    ];

    public const EVAL_CATEGORIES = [
        'mlp' => 'MLP',
        'sap' => 'SAP',
        'multigame' => 'Multigame',
        'cabinet' => 'Cabinet',
    ];

    public const EVAL_CRITERIA = [
        'graphic' => 'Graphic',
        'sound' => 'Sound',
        'theme' => 'Theme',
        'mechanics' => 'Mechanics/Features',
        'entertainment' => 'Entertainment',
        'innovation' => 'Innovation',
        'potential' => 'Potential',
        'general' => 'General',
    ];

    public function forEvent(int $eventId): static
    {
        $clone = clone $this;
        $clone->eventId = $eventId;

        return $clone;
    }

    public function event(): ScoutEvent
    {
        if ($this->eventId !== null) {
            $event = ScoutEvent::query()->find($this->eventId);
            if ($event !== null) {
                return $event;
            }
        }

        return ScoutEvent::default();
    }

    public function eventId(): int
    {
        return (int) $this->event()->ID;
    }

    public function seedTeamsIfEmpty(?int $createdBy = null): void
    {
        if ($this->teamsQuery()->exists()) {
            return;
        }

        foreach (['Team A', 'Team B', 'Team C', 'Team D', 'Team E'] as $name) {
            Ice2027Team::query()->create([
                'event_ID' => $this->eventId(),
                'name' => $name,
                'created_by' => $createdBy,
                'created_at' => now(),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function bootstrap(User $user): array
    {
        $this->seedTeamsIfEmpty($user->ID);

        $team = $this->teamForUser($user->ID);
        $assigned = $this->competitorsForUser($user->ID);
        $evalProgress = $this->evaluationProgress((int) $user->ID);
        $teamId = (int) ($team['ID'] ?? 0);
        $qStates = $teamId > 0 ? $this->teamQuestionnaireStates($teamId) : [];
        $memberNames = [];
        if ($teamId > 0) {
            foreach ($this->teams() as $row) {
                if ((int) $row['ID'] !== $teamId) {
                    continue;
                }
                foreach ($row['members'] as $member) {
                    $name = trim((string) ($member['name'] ?? ''));
                    if ($name !== '') {
                        $memberNames[] = $name;
                    }
                }
                break;
            }
        }

        $competitors = array_map(function (array $competitor) use ($qStates, $evalProgress) {
            $id = (int) $competitor['ID'];
            $state = $qStates[$id] ?? ['started' => false, 'complete' => false];

            return [
                ...$competitor,
                'questionnaire_started' => ! empty($state['started']),
                'questionnaire_done' => ! empty($state['complete']),
                'evaluation_done' => ! empty($evalProgress['complete']),
                'evaluation_started' => ! empty($evalProgress['started']),
            ];
        }, $assigned);

        $doneCount = count(array_filter($competitors, fn (array $row) => $row['questionnaire_done']));
        $startedCount = count(array_filter($competitors, fn (array $row) => $row['questionnaire_started']));

        return [
            'me' => [
                'attendant' => $this->isAttendant($user),
                'admin' => $this->canManage($user),
                'scout' => $team !== null,
                'team' => $team,
                'team_members' => $memberNames,
                'evaluation_done' => ! empty($evalProgress['complete']),
                'evaluation_progress' => $evalProgress,
                'questionnaires_started' => $startedCount,
                'questionnaires_done' => $doneCount,
                'questionnaires_total' => count($competitors),
                'superuser' => $user->isSuperuser(),
            ],
            'competitors' => $competitors,
            'all_competitors' => $this->competitors(),
            'game_types' => self::GAME_TYPES,
            'event' => [
                'ID' => $this->eventId(),
                'slug' => $this->event()->slug,
                'name' => $this->event()->name,
            ],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function activeUsers(): array
    {
        return User::query()
            ->where('active', 1)
            ->orderBy('lastname')
            ->orderBy('firstname')
            ->get(['ID', 'firstname', 'lastname', 'username'])
            ->map(function (User $person) {
                $attendant = ScoutAttendant::query()
                    ->where('event_ID', $this->eventId())
                    ->where('user_ID', $person->ID)
                    ->first();

                return [
                    'ID' => (int) $person->ID,
                    'firstname' => $person->firstname,
                    'lastname' => $person->lastname,
                    'username' => $person->username,
                    'name' => $person->displayName(),
                    'iceattendent2027' => $attendant !== null,
                    'may_manage' => (bool) ($attendant?->may_manage),
                ];
            })
            ->values()
            ->all();
    }

    public function setAttendant(int $userId, bool $enabled, ?bool $mayManage = null): string
    {
        $user = User::query()->where('ID', $userId)->where('active', 1)->first();
        if ($user === null) {
            throw new InvalidArgumentException('That user was not found or is inactive.');
        }

        $label = $this->event()->name;
        if ($enabled) {
            $row = ScoutAttendant::query()->firstOrCreate(
                ['event_ID' => $this->eventId(), 'user_ID' => $userId],
                ['may_manage' => false],
            );
            if ($mayManage !== null) {
                $row->may_manage = $mayManage;
                $row->save();
            }
        } else {
            ScoutAttendant::query()
                ->where('event_ID', $this->eventId())
                ->where('user_ID', $userId)
                ->delete();
            Ice2027TeamMember::query()
                ->where('event_ID', $this->eventId())
                ->where('user_ID', $userId)
                ->delete();
        }

        if ($this->event()->slug === 'ice2027') {
            $user->iceattendent2027 = $enabled;
            $user->save();
        }

        return $enabled ? $label.' access enabled.' : $label.' access removed.';
    }

    /**
     * @param  list<int|string>  $attendantIds
     * @param  list<int|string>  $manageIds
     */
    public function saveAttendants(array $attendantIds, array $manageIds): string
    {
        $activeIds = User::query()->where('active', 1)->pluck('ID')->map(fn ($id) => (int) $id)->all();
        $activeLookup = array_fill_keys($activeIds, true);
        $attendantIds = array_values(array_unique(array_filter(
            array_map('intval', $attendantIds),
            fn (int $id) => isset($activeLookup[$id]),
        )));
        $manageIds = array_values(array_unique(array_filter(
            array_map('intval', $manageIds),
            fn (int $id) => isset($activeLookup[$id]),
        )));
        $keepIds = array_values(array_unique(array_merge($attendantIds, $manageIds)));
        $manageLookup = array_fill_keys($manageIds, true);
        $eventId = $this->eventId();
        $syncLegacy = $this->event()->slug === 'ice2027';

        DB::transaction(function () use ($keepIds, $manageLookup, $eventId, $syncLegacy) {
            $removeQuery = ScoutAttendant::query()->where('event_ID', $eventId);
            if ($keepIds !== []) {
                $removeQuery->whereNotIn('user_ID', $keepIds);
            }
            $removeIds = $removeQuery->pluck('user_ID')->map(fn ($id) => (int) $id)->all();
            if ($removeIds !== []) {
                ScoutAttendant::query()
                    ->where('event_ID', $eventId)
                    ->whereIn('user_ID', $removeIds)
                    ->delete();
                Ice2027TeamMember::query()
                    ->where('event_ID', $eventId)
                    ->whereIn('user_ID', $removeIds)
                    ->delete();
                if ($syncLegacy) {
                    User::query()->whereIn('ID', $removeIds)->update(['iceattendent2027' => false]);
                }
            }

            foreach ($keepIds as $userId) {
                ScoutAttendant::query()->updateOrCreate(
                    ['event_ID' => $eventId, 'user_ID' => $userId],
                    ['may_manage' => isset($manageLookup[$userId])],
                );
            }
            if ($syncLegacy && $keepIds !== []) {
                User::query()->whereIn('ID', $keepIds)->update(['iceattendent2027' => true]);
            }
        });

        $label = $this->event()->name;
        $message = $label.' access saved: '.count($keepIds).' attendant'.(count($keepIds) === 1 ? '' : 's');
        if ($manageIds !== []) {
            $message .= ', '.count($manageIds).' with full access';
        }

        return $message.'.';
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function teams(): array
    {
        $teams = $this->teamsQuery()->orderBy('ID')->get(['ID', 'name']);
        $members = Ice2027TeamMember::query()
            ->with('user:ID,firstname,lastname,username')
            ->where('event_ID', $this->eventId())
            ->get();
        $competitors = $this->competitorsQuery()->orderBy('name')->get(['ID', 'name', 'team_ID']);
        $games = Ice2027Game::query()
            ->whereHas('competitor', fn ($query) => $query->where('event_ID', $this->eventId()))
            ->with('competitor:ID,team_ID')
            ->orderBy('name')
            ->get(['ID', 'name', 'game_type', 'competitor_ID']);

        return $teams->map(function (Ice2027Team $team) use ($members, $competitors, $games) {
            $teamId = (int) $team->ID;
            $teamMembers = $members
                ->filter(fn (Ice2027TeamMember $member) => (int) $member->team_ID === $teamId)
                ->values()
                ->map(fn (Ice2027TeamMember $member) => [
                    'user_ID' => (int) $member->user_ID,
                    'firstname' => $member->user?->firstname,
                    'lastname' => $member->user?->lastname,
                    'username' => $member->user?->username,
                    'name' => $member->user?->displayName(),
                ])
                ->all();
            $teamCompetitors = $competitors
                ->filter(fn (Ice2027Competitor $competitor) => (int) ($competitor->team_ID ?? 0) === $teamId)
                ->values()
                ->map(fn (Ice2027Competitor $competitor) => [
                    'ID' => (int) $competitor->ID,
                    'name' => $competitor->name,
                    'team_ID' => $competitor->team_ID === null ? null : (int) $competitor->team_ID,
                ])
                ->all();
            $teamGames = $games
                ->filter(fn (Ice2027Game $game) => (int) ($game->competitor?->team_ID ?? 0) === $teamId)
                ->values()
                ->map(fn (Ice2027Game $game) => [
                    'ID' => (int) $game->ID,
                    'name' => $game->name,
                    'game_type' => $game->game_type,
                    'competitor_ID' => (int) $game->competitor_ID,
                ])
                ->all();

            return [
                'ID' => $teamId,
                'name' => $team->name,
                'members' => $teamMembers,
                'competitors' => $teamCompetitors,
                'games' => $teamGames,
            ];
        })->values()->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function adminOverview(): array
    {
        $this->seedTeamsIfEmpty();

        $users = $this->activeUsers();
        $attendants = array_values(array_filter($users, fn (array $person) => $person['iceattendent2027']));
        $teams = $this->teams();
        $competitors = $this->competitors();
        $games = $this->games();
        $memberCount = array_sum(array_map(fn (array $team) => count($team['members']), $teams));
        $assignedCompetitors = count(array_filter($competitors, fn (array $row) => ! empty($row['team_ID'])));

        return [
            'stats' => [
                'attendants' => count($attendants),
                'teams' => count($teams),
                'max_teams' => self::MAX_TEAMS,
                'members' => $memberCount,
                'max_members' => self::MAX_TEAMS * self::MEMBERS_PER_TEAM,
                'competitors' => $assignedCompetitors,
                'max_competitors' => self::MAX_TEAMS * self::COMPETITORS_PER_TEAM,
                'games' => count($games),
            ],
            'users' => $users,
            'teams' => $teams,
            'competitors' => $competitors,
            'games' => $games,
            'game_types' => self::GAME_TYPES,
            'reminders' => $this->reminderRecipients(),
            'event' => [
                'ID' => $this->eventId(),
                'slug' => $this->event()->slug,
                'name' => $this->event()->name,
            ],
        ];
    }

    public function renameTeam(int $teamId, string $name): string
    {
        $name = trim($name);
        if ($name === '') {
            throw new InvalidArgumentException('Team name is required.');
        }

        $team = $this->teamsQuery()->find($teamId);
        if ($team === null) {
            throw new InvalidArgumentException('Team not found.');
        }

        $team->name = $name;
        $team->save();

        return 'Team name saved.';
    }

    /**
     * @param  list<int>  $userIds
     */
    public function setTeamMembers(int $teamId, array $userIds): string
    {
        $team = $this->teamsQuery()->find($teamId);
        if ($team === null) {
            throw new InvalidArgumentException('Team not found.');
        }

        $userIds = array_values(array_unique(array_filter(array_map('intval', $userIds))));
        if (count($userIds) > self::MEMBERS_PER_TEAM) {
            throw new InvalidArgumentException('A team can have at most '.self::MEMBERS_PER_TEAM.' members.');
        }

        foreach ($userIds as $userId) {
            $exists = User::query()->where('ID', $userId)->where('active', 1)->first();
            if ($exists === null) {
                throw new InvalidArgumentException('That user was not found or is inactive.');
            }
            if (! $this->isAttendant($exists)) {
                throw new InvalidArgumentException('That user is not marked as an attendant for this event.');
            }
            $elsewhere = Ice2027TeamMember::query()
                ->where('user_ID', $userId)
                ->where('event_ID', $this->eventId())
                ->where('team_ID', '<>', $teamId)
                ->exists();
            if ($elsewhere) {
                throw new InvalidArgumentException('That person is already on another scouting team.');
            }
        }

        DB::transaction(function () use ($teamId, $userIds): void {
            Ice2027TeamMember::query()->where('team_ID', $teamId)->delete();
            foreach ($userIds as $userId) {
                Ice2027TeamMember::query()->create([
                    'event_ID' => $this->eventId(),
                    'team_ID' => $teamId,
                    'user_ID' => $userId,
                ]);
            }
        });

        return 'Team members saved.';
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function competitors(): array
    {
        return $this->competitorsQuery()
            ->with('team:ID,name')
            ->withCount('games')
            ->orderBy('name')
            ->get()
            ->map(fn (Ice2027Competitor $competitor) => [
                'ID' => (int) $competitor->ID,
                'name' => $competitor->name,
                'team_ID' => $competitor->team_ID === null ? null : (int) $competitor->team_ID,
                'team_name' => $competitor->team?->name,
                'game_count' => (int) $competitor->games_count,
            ])
            ->values()
            ->all();
    }

    public function addCompetitor(string $name, ?int $teamId, ?int $createdBy): string
    {
        $name = trim($name);
        if ($name === '') {
            throw new InvalidArgumentException('Competitor name is required.');
        }

        Ice2027Competitor::query()->create([
            'event_ID' => $this->eventId(),
            'name' => $name,
            'team_ID' => $this->validatedTeamAssignment($teamId, null),
            'created_by' => $createdBy,
            'created_at' => now(),
        ]);

        return 'Competitor added.';
    }

    public function updateCompetitor(int $id, string $name, ?int $teamId): string
    {
        $name = trim($name);
        if ($name === '') {
            throw new InvalidArgumentException('Competitor name is required.');
        }

        $current = $this->competitorsQuery()->find($id);
        if ($current === null) {
            throw new InvalidArgumentException('Competitor not found.');
        }

        $current->name = $name;
        $current->team_ID = $this->validatedTeamAssignment($teamId, $id);
        $current->save();

        return 'Competitor saved.';
    }

    public function deleteCompetitor(int $id): string
    {
        $this->competitorsQuery()->where('ID', $id)->delete();

        return 'Competitor and their games were deleted.';
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function games(): array
    {
        return Ice2027Game::query()
            ->whereHas('competitor', fn ($query) => $query->where('event_ID', $this->eventId()))
            ->with(['competitor:ID,name,team_ID', 'competitor.team:ID,name'])
            ->orderBy('name')
            ->get()
            ->sortBy(fn (Ice2027Game $game) => mb_strtolower((string) $game->competitor?->name).' '.mb_strtolower($game->name))
            ->values()
            ->map(fn (Ice2027Game $game) => [
                'ID' => (int) $game->ID,
                'name' => $game->name,
                'game_type' => $game->game_type,
                'competitor_ID' => (int) $game->competitor_ID,
                'competitor_name' => $game->competitor?->name,
                'team_ID' => $game->competitor?->team_ID === null ? null : (int) $game->competitor->team_ID,
                'team_name' => $game->competitor?->team?->name,
            ])
            ->all();
    }

    public function addGame(int $competitorId, string $name, string $gameType, ?int $createdBy): string
    {
        $name = trim($name);
        if ($name === '') {
            throw new InvalidArgumentException('Game name is required.');
        }
        if (! $this->competitorsQuery()->where('ID', $competitorId)->exists()) {
            throw new InvalidArgumentException('Competitor not found.');
        }

        Ice2027Game::query()->create([
            'competitor_ID' => $competitorId,
            'name' => $name,
            'game_type' => $this->validatedGameType($gameType),
            'created_by' => $createdBy,
            'created_at' => now(),
        ]);

        return 'Competitor game added.';
    }

    public function updateGame(int $id, int $competitorId, string $name, string $gameType): string
    {
        $name = trim($name);
        if ($name === '') {
            throw new InvalidArgumentException('Game name is required.');
        }

        $game = Ice2027Game::query()->find($id);
        if ($game === null) {
            throw new InvalidArgumentException('Game not found.');
        }
        if (! $this->competitorsQuery()->where('ID', $competitorId)->exists()) {
            throw new InvalidArgumentException('Competitor not found.');
        }

        $game->competitor_ID = $competitorId;
        $game->name = $name;
        $game->game_type = $this->validatedGameType($gameType);
        $game->save();

        return 'Game saved.';
    }

    public function deleteGame(int $id): string
    {
        Ice2027Game::query()->where('ID', $id)->delete();

        return 'Game deleted.';
    }

    /**
     * @return array{ID: int, name: string}|null
     */
    public function teamForUser(int $userId): ?array
    {
        $member = Ice2027TeamMember::query()
            ->with('team:ID,name')
            ->where('event_ID', $this->eventId())
            ->where('user_ID', $userId)
            ->first();

        if ($member?->team === null) {
            return null;
        }

        return [
            'ID' => (int) $member->team->ID,
            'name' => $member->team->name,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function competitorsForUser(int $userId): array
    {
        $team = $this->teamForUser($userId);
        if ($team === null) {
            return [];
        }

        return Ice2027Competitor::query()
            ->with('team:ID,name')
            ->withCount('games')
            ->where('event_ID', $this->eventId())
            ->where('team_ID', $team['ID'])
            ->orderBy('name')
            ->get()
            ->map(fn (Ice2027Competitor $competitor) => [
                'ID' => (int) $competitor->ID,
                'name' => $competitor->name,
                'team_ID' => $competitor->team_ID === null ? null : (int) $competitor->team_ID,
                'team_name' => $competitor->team?->name,
                'game_count' => (int) $competitor->games_count,
            ])
            ->values()
            ->all();
    }

    public function isScout(int $userId): bool
    {
        return $this->teamForUser($userId) !== null;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function saveQuestionnaire(int $userId, int $competitorId, array $payload): string
    {
        if ($this->competitorForUser($userId, $competitorId) === null) {
            throw new InvalidArgumentException('That competitor is not assigned to you.');
        }

        $team = $this->teamForUser($userId);
        if ($team === null) {
            throw new InvalidArgumentException('You are not on a scouting team.');
        }

        $row = ScoutQuestionnaire::query()->firstOrNew([
            'event_ID' => $this->eventId(),
            'team_ID' => $team['ID'],
            'competitor_ID' => $competitorId,
        ]);
        if ($row->exists && is_array($row->payload)) {
            ScoutQuestionnaireHistory::query()->create([
                'questionnaire_ID' => $row->ID,
                'user_ID' => $userId,
                'payload' => $row->payload,
                'saved_at' => now(),
            ]);
        }
        $incoming = isset($payload['new']) || isset($payload['mlp']) || isset($payload['products'])
            ? $payload
            : ['products' => $payload];
        $store = ['products' => $this->questionnaireProducts($incoming)];

        $row->payload = $store;
        $row->updated_by = $userId;
        $row->updated_at = now();
        $row->save();

        Ice2027Questionnaire::query()->updateOrCreate(
            ['user_ID' => $userId, 'competitor_ID' => $competitorId],
            ['payload' => $store, 'submitted_at' => now()],
        );

        return 'Questionnaire saved.';
    }

    public function hasQuestionnaire(int $userId, int $competitorId): bool
    {
        $team = $this->teamForUser($userId);
        if ($team === null) {
            return false;
        }

        return ScoutQuestionnaire::query()
            ->where('event_ID', $this->eventId())
            ->where('team_ID', $team['ID'])
            ->where('competitor_ID', $competitorId)
            ->exists();
    }

    /**
     * @return array<string, mixed>
     */
    public function questionnairePayload(int $userId, int $competitorId): array
    {
        $team = $this->teamForUser($userId);
        if ($team === null) {
            return [];
        }

        $row = ScoutQuestionnaire::query()
            ->where('event_ID', $this->eventId())
            ->where('team_ID', $team['ID'])
            ->where('competitor_ID', $competitorId)
            ->first();

        if ($row === null) {
            $row = Ice2027Questionnaire::query()
                ->where('user_ID', $userId)
                ->where('competitor_ID', $competitorId)
                ->first();
        }

        return is_array($row?->payload) ? $row->payload : [];
    }

    /**
     * @return array<string, mixed>
     */
    public function questionnaireView(User $user, int $competitorId): array
    {
        $assigned = $this->competitorForUser((int) $user->ID, $competitorId);
        if ($assigned === null) {
            throw new InvalidArgumentException('That competitor is not assigned to you.');
        }

        $team = $this->teamForUser((int) $user->ID);
        $teamId = (int) ($team['ID'] ?? 0);
        $raw = $this->questionnairePayload((int) $user->ID, $competitorId);
        $products = array_map(function (array $product) use ($competitorId, $teamId) {
            $product['photos'] = $this->photosFromProduct($product, $competitorId, $teamId);

            return $product;
        }, $this->questionnaireProducts($raw));

        $games = array_values(array_filter(
            $this->games(),
            fn (array $game) => (int) $game['competitor_ID'] === $competitorId
        ));
        $catalogIds = array_map(fn (array $game) => (int) $game['ID'], $games);
        $coverage = $this->questionnaireCoverage(['products' => $products], $catalogIds);

        $row = $teamId > 0
            ? ScoutQuestionnaire::query()
                ->with('updater')
                ->where('event_ID', $this->eventId())
                ->where('team_ID', $teamId)
                ->where('competitor_ID', $competitorId)
                ->first()
            : null;

        $history = [];
        if ($row !== null) {
            $history[] = [
                'ID' => (int) $row->ID,
                'by' => $row->updater?->displayName() ?? '',
                'at' => optional($row->updated_at)->format('d M Y H:i'),
                'product_count' => count($products),
                'products' => $products,
                'is_current' => true,
            ];
            $entries = ScoutQuestionnaireHistory::query()
                ->with('user')
                ->where('questionnaire_ID', $row->ID)
                ->orderByDesc('saved_at')
                ->limit(20)
                ->get();
            foreach ($entries as $entry) {
                $oldProducts = $this->questionnaireProducts(is_array($entry->payload) ? $entry->payload : []);
                $history[] = [
                    'ID' => (int) $entry->ID,
                    'by' => $entry->user?->displayName() ?? '',
                    'at' => optional($entry->saved_at)->format('d M Y H:i'),
                    'product_count' => count($oldProducts),
                    'products' => $oldProducts,
                    'is_current' => false,
                ];
            }
        }

        $memberNames = [];
        if ($teamId > 0) {
            foreach ($this->teams() as $teamRow) {
                if ((int) $teamRow['ID'] !== $teamId) {
                    continue;
                }
                foreach ($teamRow['members'] as $member) {
                    $name = trim((string) ($member['name'] ?? ''));
                    if ($name !== '') {
                        $memberNames[] = $name;
                    }
                }
                break;
            }
        }

        return [
            'competitor' => $assigned,
            'products' => $products,
            'games' => $games,
            'game_types' => self::GAME_TYPES,
            'team_members' => $memberNames,
            'updated_by' => $row?->updater?->displayName(),
            'updated_at' => optional($row?->updated_at)->format('d M Y H:i'),
            'history' => $history,
            'started' => ! empty($coverage['started']) || $row !== null,
            'complete' => ! empty($coverage['complete']),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function saveEvaluation(int $userId, array $payload): string
    {
        $payload = $this->normalizedEvaluationPayload($payload);
        $errors = [];
        foreach ($this->incompleteEvaluationRows($payload) as $rank => $missing) {
            $labels = array_map(fn (string $field) => $this->evaluationFieldLabel($field), $missing);
            $errors[] = 'Row '.$rank.' is incomplete. Please fill in: '.implode(', ', $labels).'.';
        }
        if ($errors !== []) {
            throw new InvalidArgumentException(implode(' ', $errors));
        }
        if ($this->completeEvaluationRowCount($payload) < 1) {
            Ice2027Evaluation::query()
                ->where('user_ID', $userId)
                ->where('event_ID', $this->eventId())
                ->delete();

            return 'Evaluation cleared.';
        }
        $seenGames = [];
        foreach (($payload['top5'] ?? []) as $rank => $row) {
            if (! is_array($row) || $this->evaluationRowState($row)['missing'] !== []) {
                continue;
            }
            $gameId = $this->evaluationRowCatalogGameId($row);
            if ($gameId < 1) {
                continue;
            }
            if (isset($seenGames[$gameId])) {
                $errors[] = 'You already rated that game in row '.$seenGames[$gameId].'. Pick a different game in row '.(int) $rank.'.';
            } else {
                $seenGames[$gameId] = (int) $rank;
            }
        }
        if ($errors !== []) {
            throw new InvalidArgumentException(implode(' ', $errors));
        }

        Ice2027Evaluation::query()->updateOrCreate(
            ['user_ID' => $userId, 'event_ID' => $this->eventId()],
            ['payload' => $payload, 'submitted_at' => now()],
        );

        return 'Evaluation saved.';
    }

    public function hasEvaluation(int $userId): bool
    {
        return Ice2027Evaluation::query()
            ->where('user_ID', $userId)
            ->where('event_ID', $this->eventId())
            ->exists();
    }

    /**
     * @return array<string, mixed>
     */
    public function evaluationPayload(int $userId): array
    {
        $row = Ice2027Evaluation::query()
            ->where('user_ID', $userId)
            ->where('event_ID', $this->eventId())
            ->first();

        return is_array($row?->payload) ? $row->payload : [];
    }

    /**
     * @return list<int>
     */
    public function evaluatedCompetitorIds(int $userId): array
    {
        $payload = $this->evaluationPayload($userId);
        $byName = [];
        foreach ($this->competitors() as $competitor) {
            $byName[strtolower(trim((string) $competitor['name']))] = (int) $competitor['ID'];
        }

        $ids = [];
        foreach (($payload['top5'] ?? []) as $row) {
            if (! is_array($row)) {
                continue;
            }
            $id = (int) ($row['competitor_ID'] ?? 0);
            if ($id < 1) {
                $name = strtolower(trim((string) ($row['competitor'] ?? '')));
                $id = $byName[$name] ?? 0;
            }
            if ($id > 0) {
                $ids[] = $id;
            }
        }

        return array_values(array_unique($ids));
    }

    /**
     * @return array<string, mixed>|null
     */
    public function competitorForUser(int $userId, int $competitorId): ?array
    {
        if ($competitorId < 1) {
            return null;
        }

        foreach ($this->competitorsForUser($userId) as $competitor) {
            if ((int) $competitor['ID'] === $competitorId) {
                return $competitor;
            }
        }

        return null;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function normalizedTop5(array $payload, int $focusId = 0): array
    {
        $competitors = $this->competitors();
        $validIds = array_map(fn (array $row) => (int) $row['ID'], $competitors);
        $rows = [];
        $saved = $payload['top5'] ?? [];
        if (! is_array($saved)) {
            $saved = [];
        }

        for ($rank = 1; $rank <= 5; $rank++) {
            $row = $this->evaluationRowFromSaved($saved, $rank);
            $rows[$rank] = $row;
        }

        if ($focusId > 0 && in_array($focusId, $validIds, true)) {
            $already = false;
            foreach ($rows as $row) {
                if ($this->competitorIdFromEvalRow($row, $competitors) === $focusId) {
                    $already = true;
                    break;
                }
            }
            if (! $already) {
                for ($rank = 1; $rank <= 5; $rank++) {
                    if ($this->competitorIdFromEvalRow($rows[$rank], $competitors) < 1) {
                        $rows[$rank]['competitor_ID'] = $focusId;
                        break;
                    }
                }
            }
        }

        return array_values(array_map(fn (array $row) => $this->sanitizeEvalRow($row, $competitors), $rows));
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return array<string, mixed>
     */
    public function evaluationPayloadFromRows(array $rows): array
    {
        return $this->normalizedEvaluationPayload(['top5' => $rows]);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{top5: array<string, array<string, mixed>>}
     */
    public function normalizedEvaluationPayload(array $payload): array
    {
        $saved = $payload['top5'] ?? $payload;
        if (! is_array($saved)) {
            $saved = [];
        }
        $competitors = $this->competitors();
        $top5 = [];
        for ($rank = 1; $rank <= self::EVAL_REQUIRED_ROWS; $rank++) {
            $row = $this->evaluationRowFromSaved($saved, $rank);
            $top5[(string) $rank] = $this->sanitizeEvalRow($row, $competitors);
        }

        return ['top5' => $top5];
    }

    /**
     * Accept both a 0-based list from the SPA and rank-keyed {1..5} payloads from storage.
     *
     * @param  array<int|string, mixed>  $saved
     * @return array<string, mixed>
     */
    private function evaluationRowFromSaved(array $saved, int $rank): array
    {
        if ($saved === []) {
            return [];
        }

        if (array_is_list($saved)) {
            $row = $saved[$rank - 1] ?? [];

            return is_array($row) ? $row : [];
        }

        $row = $saved[$rank] ?? $saved[(string) $rank] ?? [];

        return is_array($row) ? $row : [];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function completeEvaluationRowCount(array $payload): int
    {
        $count = 0;
        foreach (($payload['top5'] ?? []) as $row) {
            if (is_array($row) && $this->evaluationRowComplete($row)) {
                $count++;
            }
        }

        return $count;
    }

    public function isEvaluationComplete(int $userId): bool
    {
        return $this->completeEvaluationRowCount($this->evaluationPayload($userId)) >= self::EVAL_REQUIRED_ROWS;
    }

    /**
     * @return array{rows:int,required:int,complete:bool,started:bool,label:string,detail:string}
     */
    public function evaluationProgress(int $userId): array
    {
        return $this->evaluationStatusFromRows($this->completeEvaluationRowCount($this->evaluationPayload($userId)));
    }

    /**
     * @return array{rows:int,required:int,complete:bool,started:bool,label:string,detail:string}
     */
    public function evaluationStatusFromRows(int $rows): array
    {
        $required = self::EVAL_REQUIRED_ROWS;
        $complete = $rows >= $required;
        $started = $rows > 0;
        if ($complete) {
            $label = 'Done · '.$rows.'/'.$required;
            $detail = 'You have rated all '.$required.' games. You can still edit your evaluation.';
        } elseif ($started) {
            $label = $rows.'/'.$required.' games rated';
            $detail = 'You have rated '.$rows.' of '.$required.' games. Fill all '.$required.' rows to complete your evaluation.';
        } else {
            $label = 'Not started';
            $detail = 'Rate your Top '.$required.' games. Evaluation is complete when all '.$required.' rows are filled.';
        }

        return [
            'rows' => $rows,
            'required' => $required,
            'complete' => $complete,
            'started' => $started,
            'label' => $label,
            'detail' => $detail,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function evaluationDashboard(array $filters = []): array
    {
        $criteria = array_keys(self::EVAL_CRITERIA);
        $competitors = [];
        foreach ($this->competitors() as $competitor) {
            $competitors[(int) $competitor['ID']] = $competitor;
        }
        $gamesCatalog = [];
        foreach ($this->games() as $game) {
            $gamesCatalog[(int) $game['ID']] = $game;
        }
        $teams = $this->teams();
        $teamByUser = [];
        foreach ($teams as $team) {
            foreach ($team['members'] as $member) {
                $teamByUser[(int) $member['user_ID']] = [
                    'ID' => (int) $team['ID'],
                    'name' => (string) $team['name'],
                ];
            }
        }

        $filterTeam = (int) ($filters['team_ID'] ?? 0);
        $filterCompetitor = (int) ($filters['competitor_ID'] ?? 0);
        $filterType = trim((string) ($filters['game_type'] ?? ''));
        $filterPlay = trim((string) ($filters['would_play'] ?? ''));

        $ratings = [];
        $submissions = 0;
        $evals = Ice2027Evaluation::query()
            ->where('event_ID', $this->eventId())
            ->with('user:ID,firstname,lastname,username')
            ->get();

        foreach ($evals as $eval) {
            $payload = is_array($eval->payload) ? $eval->payload : [];
            $submissions++;
            $userId = (int) $eval->user_ID;
            $raterTeam = $teamByUser[$userId] ?? null;
            foreach (($payload['top5'] ?? []) as $rank => $row) {
                if (! is_array($row) || ! $this->evaluationRowComplete($row)) {
                    continue;
                }
                $resolved = $this->resolveEvaluationGame($row, $competitors, $gamesCatalog);
                if ($filterTeam > 0 && (int) ($raterTeam['ID'] ?? 0) !== $filterTeam) {
                    continue;
                }
                if ($filterCompetitor > 0 && $resolved['competitor_ID'] !== $filterCompetitor) {
                    continue;
                }
                if ($filterType !== '' && $resolved['game_type'] !== $filterType) {
                    continue;
                }
                if ($filterPlay !== '' && $resolved['would_play'] !== $filterPlay) {
                    continue;
                }
                $scores = [];
                foreach ($criteria as $field) {
                    $scores[$field] = (int) $row[$field];
                }
                $ratings[] = [
                    'user_ID' => $userId,
                    'rater' => $eval->user?->displayName() ?: (string) ($eval->user?->username ?? ''),
                    'team_ID' => (int) ($raterTeam['ID'] ?? 0),
                    'team' => (string) ($raterTeam['name'] ?? ''),
                    'rank' => (int) $rank,
                    'scores' => $scores,
                    'average' => array_sum($scores) / max(1, count($scores)),
                ] + $resolved;
            }
        }

        $groups = [];
        foreach ($ratings as $rating) {
            $key = $rating['key'];
            if (! isset($groups[$key])) {
                $groups[$key] = [
                    'key' => $key,
                    'game_ID' => $rating['game_ID'],
                    'game' => $rating['game'],
                    'competitor_ID' => $rating['competitor_ID'],
                    'competitor' => $rating['competitor'],
                    'game_type' => $rating['game_type'],
                    'is_new_product' => $rating['is_new_product'],
                    'ratings' => 0,
                    'rank1' => 0,
                    'rank_sum' => 0,
                    'play_yes' => 0,
                    'play_no' => 0,
                    'play_unsure' => 0,
                    'voters' => [],
                    'score_sums' => array_fill_keys($criteria, 0.0),
                    'total' => 0.0,
                ];
            }
            $groups[$key]['ratings']++;
            $groups[$key]['voters'][$rating['user_ID']] = true;
            $groups[$key]['rank_sum'] += $rating['rank'];
            $groups[$key]['total'] += $rating['average'];
            if ($rating['rank'] === 1) {
                $groups[$key]['rank1']++;
            }
            if ($rating['would_play'] === 'yes') {
                $groups[$key]['play_yes']++;
            } elseif ($rating['would_play'] === 'no') {
                $groups[$key]['play_no']++;
            } elseif ($rating['would_play'] === 'unsure') {
                $groups[$key]['play_unsure']++;
            }
            foreach ($rating['scores'] as $field => $score) {
                $groups[$key]['score_sums'][$field] += $score;
            }
        }

        $games = [];
        foreach ($groups as $group) {
            $count = max(1, $group['ratings']);
            $averages = [];
            foreach ($group['score_sums'] as $field => $sum) {
                $averages[$field] = $sum / $count;
            }
            $type = (string) $group['game_type'];
            $games[] = [
                'key' => $group['key'],
                'game_ID' => $group['game_ID'],
                'game' => $group['game'],
                'competitor_ID' => $group['competitor_ID'],
                'competitor' => $group['competitor'],
                'game_type' => $type,
                'game_type_label' => self::GAME_TYPES[$type] ?? ($type !== '' ? $type : '—'),
                'is_new_product' => $group['is_new_product'],
                'ratings' => $group['ratings'],
                'voters' => count($group['voters']),
                'rank1' => $group['rank1'],
                'avg_rank' => $group['rank_sum'] / $count,
                'average' => $group['total'] / $count,
                'averages' => $averages,
                'play_yes' => $group['play_yes'],
                'play_no' => $group['play_no'],
                'play_unsure' => $group['play_unsure'],
                'play_pct' => ($group['play_yes'] / $count) * 100,
            ];
        }

        usort($games, static fn (array $a, array $b): int => [$b['average'], $b['rank1'], $b['ratings'], $a['game']] <=> [$a['average'], $a['rank1'], $a['ratings'], $b['game']]);
        foreach ($games as $i => &$game) {
            $game['place'] = $i + 1;
        }
        unset($game);

        $photoIndex = $this->questionnairePhotoIndex();
        foreach ($games as &$game) {
            $photos = $photoIndex['by_key'][$game['key']] ?? [];
            $game['photos'] = $photos;
            $game['photo_count'] = count($photos);
        }
        unset($game);

        $byCriterion = [];
        foreach (self::EVAL_CRITERIA as $field => $label) {
            $best = null;
            foreach ($games as $game) {
                if ($best === null || $game['averages'][$field] > $best['averages'][$field]) {
                    $best = $game;
                }
            }
            $byCriterion[$field] = $best;
        }

        $byType = [];
        foreach ($games as $game) {
            $type = $game['game_type'] !== '' ? $game['game_type'] : 'unknown';
            if (! isset($byType[$type])) {
                $byType[$type] = ['type' => $type, 'count' => 0, 'ratings' => 0, 'total' => 0.0];
            }
            $byType[$type]['count']++;
            $byType[$type]['ratings'] += $game['ratings'];
            $byType[$type]['total'] += $game['average'] * $game['ratings'];
        }
        foreach ($byType as $type => &$info) {
            $info['average'] = $info['ratings'] > 0 ? $info['total'] / $info['ratings'] : 0;
            $info['label'] = self::GAME_TYPES[$type] ?? ($type === 'unknown' ? 'Unknown' : $type);
        }
        unset($info);
        uasort($byType, static fn ($a, $b) => $b['average'] <=> $a['average']);

        $playYes = count(array_filter($ratings, static fn ($row) => $row['would_play'] === 'yes'));

        return [
            'event' => [
                'ID' => $this->eventId(),
                'slug' => $this->event()->slug,
                'name' => $this->event()->name,
            ],
            'criteria' => self::EVAL_CRITERIA,
            'game_types' => self::GAME_TYPES,
            'teams' => array_map(fn (array $team) => ['ID' => (int) $team['ID'], 'name' => (string) $team['name']], $teams),
            'competitors' => array_map(fn (array $competitor) => ['ID' => (int) $competitor['ID'], 'name' => (string) $competitor['name']], $this->competitors()),
            'stats' => [
                'submissions' => $submissions,
                'ratings' => count($ratings),
                'games' => count($games),
                'play_yes' => $playYes,
                'play_pct' => $ratings !== [] ? ($playYes / count($ratings)) * 100 : 0,
            ],
            'winner' => $games[0] ?? null,
            'games' => $games,
            'by_criterion' => $byCriterion,
            'by_type' => array_values($byType),
            'ratings' => $ratings,
            'photo_games' => $photoIndex['games'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function progressDashboard(): array
    {
        $teams = $this->teams();
        $evalByUser = [];
        foreach (
            Ice2027Evaluation::query()
                ->where('event_ID', $this->eventId())
                ->with('user:ID,firstname,lastname,username')
                ->get() as $eval
        ) {
            $payload = is_array($eval->payload) ? $eval->payload : [];
            $rowCount = 0;
            foreach (($payload['top5'] ?? []) as $row) {
                if (is_array($row) && $this->evaluationRowComplete($row)) {
                    $rowCount++;
                }
            }
            $evalByUser[(int) $eval->user_ID] = [
                'rows' => $rowCount,
                'submitted_at' => optional($eval->submitted_at)?->toDateTimeString(),
            ];
        }

        $questionnaires = ScoutQuestionnaire::query()
            ->where('event_ID', $this->eventId())
            ->with('updater:ID,firstname,lastname,username')
            ->get()
            ->keyBy(fn (ScoutQuestionnaire $row) => $row->team_ID.':'.$row->competitor_ID);

        $competitorsById = [];
        foreach ($this->competitors() as $competitor) {
            $competitorsById[(int) $competitor['ID']] = $competitor;
        }
        $gamesById = [];
        foreach ($this->games() as $game) {
            $gamesById[(int) $game['ID']] = $game;
        }
        $userTeamId = [];
        foreach ($teams as $team) {
            foreach ($team['members'] as $member) {
                $userTeamId[(int) $member['user_ID']] = (int) $team['ID'];
            }
        }

        $evaluatedByTeam = [];
        foreach (
            Ice2027Evaluation::query()
                ->where('event_ID', $this->eventId())
                ->get() as $eval
        ) {
            $evaluatorTeamId = $userTeamId[(int) $eval->user_ID] ?? 0;
            if ($evaluatorTeamId < 1) {
                continue;
            }
            $payload = is_array($eval->payload) ? $eval->payload : [];
            foreach (($payload['top5'] ?? []) as $row) {
                if (! is_array($row) || ! $this->evaluationRowComplete($row)) {
                    continue;
                }
                $resolved = $this->resolveEvaluationGame($row, $competitorsById, $gamesById);
                $resolvedCompetitorId = (int) ($resolved['competitor_ID'] ?? 0);
                if ($resolvedCompetitorId < 1) {
                    continue;
                }
                $evaluatedByTeam[$evaluatorTeamId][$resolvedCompetitorId][$resolved['key']] = true;
            }
        }

        $people = [];
        $teamOut = [];
        $gameMatrix = [];
        $newGames = [];
        $evalExpected = 0;
        $evalDone = 0;
        $assignedCompetitors = 0;
        $competitorsDone = 0;
        $catalogTotal = 0;
        $catalogCovered = 0;
        $productsTotal = 0;

        foreach ($teams as $team) {
            $memberOut = [];
            foreach ($team['members'] as $member) {
                $userId = (int) $member['user_ID'];
                $evalExpected++;
                $eval = $evalByUser[$userId] ?? null;
                $rowCount = (int) ($eval['rows'] ?? 0);
                $complete = $eval !== null && $rowCount >= self::EVAL_REQUIRED_ROWS;
                if ($complete) {
                    $evalDone++;
                }
                $person = [
                    'user_ID' => $userId,
                    'name' => $member['name'] ?? trim(($member['firstname'] ?? '').' '.($member['lastname'] ?? '')),
                    'team_ID' => (int) $team['ID'],
                    'team' => (string) $team['name'],
                    'evaluation' => $complete,
                    'eval_started' => $rowCount > 0,
                    'eval_rows' => $rowCount,
                    'eval_required' => self::EVAL_REQUIRED_ROWS,
                    'eval_at' => $this->progressWhen($eval['submitted_at'] ?? null),
                ];
                $memberOut[] = $person;
                $people[] = $person;
            }

            $gamesByCompetitor = [];
            foreach ($team['games'] as $game) {
                $gamesByCompetitor[(int) $game['competitor_ID']][] = $game;
            }

            $compOut = [];
            $teamDone = 0;
            $teamPctSum = 0;
            foreach ($team['competitors'] as $competitor) {
                $assignedCompetitors++;
                $cid = (int) $competitor['ID'];
                $teamId = (int) $team['ID'];
                $key = $teamId.':'.$cid;
                $qRow = $questionnaires->get($key);
                $payload = is_array($qRow?->payload) ? $qRow->payload : [];
                $products = $this->questionnaireProducts($payload);
                $catalog = $gamesByCompetitor[$cid] ?? [];
                $catalogIds = array_map(fn (array $game) => (int) $game['ID'], $catalog);
                $catalogCount = count($catalogIds);
                $catalogTotal += $catalogCount;
                $covered = [];
                $newCount = 0;
                foreach ($products as $product) {
                    $matched = false;
                    foreach ($this->productGameIds($product) as $gameId) {
                        if (in_array($gameId, $catalogIds, true)) {
                            $covered[$gameId] = true;
                            $matched = true;
                        }
                    }
                    if (! $matched && (! empty($product['is_new_product']) || trim((string) ($product['game_name'] ?? $product['theme'] ?? '')) !== '')) {
                        $newCount++;
                    }
                }
                $coveredCount = count($covered);
                $catalogCovered += $coveredCount;
                $productCount = count($products);
                $productsTotal += $productCount;
                $percent = $catalogCount > 0
                    ? (int) round(100 * $coveredCount / $catalogCount)
                    : ($productCount > 0 ? 100 : 0);
                $complete = $catalogCount > 0 ? $coveredCount >= $catalogCount : $productCount > 0;
                if ($complete) {
                    $competitorsDone++;
                    $teamDone++;
                }
                $teamPctSum += $percent;
                $lastBy = $qRow?->updater?->displayName() ?? '';
                $gameChecks = [];

                foreach ($catalog as $game) {
                    $gid = (int) $game['ID'];
                    $evalKey = 'g:'.$gid;
                    $gameType = (string) ($game['game_type'] ?? '');
                    $questionnaireFilled = isset($covered[$gid]);
                    $evaluated = isset($evaluatedByTeam[$teamId][$cid][$evalKey]);
                    $photos = $this->photosForProductMatch($products, $cid, $gid, (string) $game['name'], $teamId);
                    $gameRow = [
                        'key' => $evalKey,
                        'game_ID' => $gid,
                        'name' => (string) $game['name'],
                        'is_new' => false,
                        'questionnaire' => $questionnaireFilled,
                        'evaluated' => $evaluated,
                        'photos' => $photos,
                        'photo_count' => count($photos),
                    ];
                    $gameChecks[] = $gameRow;
                    $gameMatrix[] = [
                        'team' => (string) $team['name'],
                        'team_ID' => $teamId,
                        'competitor' => (string) $competitor['name'],
                        'competitor_ID' => $cid,
                        'game' => (string) $game['name'],
                        'game_ID' => $gid,
                        'is_new' => false,
                        'category' => $gameType,
                        'category_label' => self::GAME_TYPES[$gameType] ?? ($gameType !== '' ? $gameType : '—'),
                        'questionnaire' => $questionnaireFilled,
                        'evaluated' => $evaluated,
                        'photos' => $photos,
                        'photo_count' => count($photos),
                    ];
                }

                foreach ($products as $product) {
                    $ids = $this->productGameIds($product);
                    $matchedCatalog = false;
                    foreach ($ids as $gameId) {
                        if (in_array($gameId, $catalogIds, true)) {
                            $matchedCatalog = true;
                            break;
                        }
                    }
                    $newName = $this->productDisplayName($product);
                    $isNew = ! empty($product['is_new_product']) || ($ids === [] && $newName !== '');
                    if ($matchedCatalog || ! $isNew) {
                        continue;
                    }
                    $evalKey = 'n:'.$cid.':'.strtolower($newName);
                    $category = (string) ($product['category'] ?? 'new_product');
                    $evaluated = isset($evaluatedByTeam[$teamId][$cid][$evalKey]);
                    $photos = $this->photosFromProduct($product, $cid, $teamId);
                    $gameChecks[] = [
                        'key' => $evalKey,
                        'game_ID' => 0,
                        'name' => $newName,
                        'is_new' => true,
                        'questionnaire' => true,
                        'evaluated' => $evaluated,
                        'photos' => $photos,
                        'photo_count' => count($photos),
                    ];
                    $gameMatrix[] = [
                        'team' => (string) $team['name'],
                        'team_ID' => $teamId,
                        'competitor' => (string) $competitor['name'],
                        'competitor_ID' => $cid,
                        'game' => $newName,
                        'game_ID' => 0,
                        'is_new' => true,
                        'category' => $category,
                        'category_label' => self::GAME_TYPES[$category] ?? ($category !== '' ? $category : 'New product'),
                        'questionnaire' => true,
                        'evaluated' => $evaluated,
                        'photos' => $photos,
                        'photo_count' => count($photos),
                    ];
                    $newGames[] = [
                        'team' => (string) $team['name'],
                        'competitor' => (string) $competitor['name'],
                        'game' => $newName,
                        'category' => $category,
                        'category_label' => self::GAME_TYPES[$category] ?? ($category !== '' ? $category : '—'),
                        'evaluated' => $evaluated,
                        'photos' => $photos,
                        'photo_count' => count($photos),
                    ];
                }

                $compOut[] = [
                    'ID' => $cid,
                    'name' => (string) $competitor['name'],
                    'questionnaire' => $complete,
                    'catalog' => $catalogCount,
                    'covered' => $coveredCount,
                    'new_products' => $newCount,
                    'products' => $productCount,
                    'percent' => $percent,
                    'complete' => $complete,
                    'started' => $productCount > 0,
                    'updated_at' => $this->progressWhen(optional($qRow)->updated_at),
                    'updated_by' => $lastBy,
                    'games' => $gameChecks,
                ];
            }

            $memberCount = count($memberOut);
            $evalTeamDone = count(array_filter($memberOut, fn (array $person) => $person['evaluation']));
            $compCount = count($compOut);
            $teamOut[] = [
                'ID' => (int) $team['ID'],
                'name' => (string) $team['name'],
                'members' => $memberOut,
                'competitors' => $compOut,
                'assigned' => $compCount,
                'done' => $teamDone,
                'percent' => $compCount > 0 ? (int) round($teamPctSum / $compCount) : 0,
                'member_count' => $memberCount,
                'eval_done' => $evalTeamDone,
                'questionnaires_done' => $teamDone,
                'questionnaires_total' => $compCount,
                'evaluations_done' => $evalTeamDone,
                'evaluations_total' => $memberCount,
            ];
        }

        foreach ($evalByUser as $userId => $eval) {
            $known = false;
            foreach ($people as $person) {
                if ((int) $person['user_ID'] === (int) $userId) {
                    $known = true;
                    break;
                }
            }
            if ($known) {
                continue;
            }
            $rowCount = (int) ($eval['rows'] ?? 0);
            $user = User::query()->find($userId);
            $people[] = [
                'user_ID' => (int) $userId,
                'name' => $user?->displayName() ?? 'Unknown',
                'team_ID' => 0,
                'team' => '',
                'evaluation' => $rowCount >= self::EVAL_REQUIRED_ROWS,
                'eval_started' => $rowCount > 0,
                'eval_rows' => $rowCount,
                'eval_required' => self::EVAL_REQUIRED_ROWS,
                'eval_at' => $this->progressWhen($eval['submitted_at'] ?? null),
            ];
        }
        usort($people, static fn (array $a, array $b) => [$a['team'], $a['name']] <=> [$b['team'], $b['name']]);

        return [
            'event' => [
                'ID' => $this->eventId(),
                'slug' => $this->event()->slug,
                'name' => $this->event()->name,
            ],
            'stats' => [
                'teams' => count($teams),
                'scouts' => $evalExpected,
                'members' => $evalExpected,
                'evaluations_done' => $evalDone,
                'evaluations_total' => $evalExpected,
                'eval_done' => $evalDone,
                'eval_expected' => $evalExpected,
                'competitors_done' => $competitorsDone,
                'competitors_total' => $assignedCompetitors,
                'competitors' => $assignedCompetitors,
                'catalog_games' => $catalogTotal,
                'catalog_covered' => $catalogCovered,
                'products' => $productsTotal,
                'research_pct' => $assignedCompetitors > 0
                    ? (int) round(100 * ($catalogTotal > 0 ? $catalogCovered / $catalogTotal : $competitorsDone / $assignedCompetitors))
                    : 0,
            ],
            'teams' => $teamOut,
            'people' => $people,
            'game_matrix' => $gameMatrix,
            'new_games' => $newGames,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<int>  $catalogIds
     * @return array{products:int,covered:int,catalog:int,new_products:int,started:bool,complete:bool}
     */
    private function questionnaireCoverage(array $payload, array $catalogIds): array
    {
        $products = $this->questionnaireProducts($payload);
        $catalogIds = array_values(array_filter(array_map('intval', $catalogIds)));
        $catalogCount = count($catalogIds);
        $covered = [];
        $newCount = 0;
        foreach ($products as $product) {
            $ids = $this->productGameIds($product);
            $matched = false;
            foreach ($ids as $id) {
                if (in_array($id, $catalogIds, true)) {
                    $covered[$id] = true;
                    $matched = true;
                }
            }
            if (! $matched && (! empty($product['is_new_product']) || trim((string) ($product['game_name'] ?? '')) !== '')) {
                $newCount++;
            }
        }
        $coveredCount = count($covered);
        $productCount = count($products);

        return [
            'products' => $productCount,
            'covered' => $coveredCount,
            'catalog' => $catalogCount,
            'new_products' => $newCount,
            'started' => $productCount > 0,
            'complete' => $catalogCount > 0 ? $coveredCount >= $catalogCount : $productCount > 0,
        ];
    }

    /**
     * @return array<int, array{started:bool,complete:bool,products:int,covered:int,catalog:int,new_products:int}>
     */
    private function teamQuestionnaireStates(int $teamId): array
    {
        if ($teamId < 1) {
            return [];
        }
        $competitors = $this->competitorsQuery()->where('team_ID', $teamId)->get(['ID']);
        $catalogByCompetitor = [];
        foreach ($this->games() as $game) {
            $catalogByCompetitor[(int) $game['competitor_ID']][] = (int) $game['ID'];
        }
        $shared = [];
        foreach (
            ScoutQuestionnaire::query()
                ->where('event_ID', $this->eventId())
                ->where('team_ID', $teamId)
                ->get() as $row
        ) {
            $shared[(int) $row->competitor_ID] = is_array($row->payload) ? $row->payload : [];
        }
        $memberIds = Ice2027TeamMember::query()
            ->where('event_ID', $this->eventId())
            ->where('team_ID', $teamId)
            ->pluck('user_ID')
            ->map(fn ($id) => (int) $id)
            ->all();
        $legacy = [];
        if ($memberIds !== []) {
            foreach (Ice2027Questionnaire::query()->whereIn('user_ID', $memberIds)->get() as $row) {
                $cid = (int) $row->competitor_ID;
                if (isset($legacy[$cid])) {
                    continue;
                }
                $decoded = is_array($row->payload) ? $row->payload : [];
                if ($this->questionnaireProducts($decoded) !== []) {
                    $legacy[$cid] = $decoded;
                }
            }
        }
        $states = [];
        foreach ($competitors as $competitor) {
            $cid = (int) $competitor->ID;
            $hasShared = array_key_exists($cid, $shared);
            $payload = $shared[$cid] ?? [];
            if ($this->questionnaireProducts($payload) === [] && isset($legacy[$cid])) {
                $payload = $legacy[$cid];
            }
            $coverage = $this->questionnaireCoverage($payload, $catalogByCompetitor[$cid] ?? []);
            $coverage['started'] = $hasShared || $coverage['started'] || isset($legacy[$cid]);
            $states[$cid] = $coverage;
        }

        return $states;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function reminderRecipients(): array
    {
        $recipients = [];
        foreach ($this->teams() as $team) {
            $qStates = $this->teamQuestionnaireStates((int) $team['ID']);
            foreach ($team['members'] as $member) {
                $userId = (int) $member['user_ID'];
                $eval = $this->evaluationProgress($userId);
                $questionnaires = [];
                foreach ($team['competitors'] as $competitor) {
                    $cid = (int) $competitor['ID'];
                    $state = $qStates[$cid] ?? ['started' => false, 'complete' => false];
                    if (! empty($state['complete'])) {
                        continue;
                    }
                    $questionnaires[] = [
                        'ID' => $cid,
                        'name' => (string) $competitor['name'],
                        'started' => ! empty($state['started']),
                    ];
                }
                if ($questionnaires === [] && ! empty($eval['complete'])) {
                    continue;
                }
                $email = trim((string) ($member['username'] ?? ''));
                $recipients[] = [
                    'user_ID' => $userId,
                    'name' => (string) ($member['name'] ?? ''),
                    'email' => $email,
                    'valid_email' => filter_var($email, FILTER_VALIDATE_EMAIL) !== false,
                    'team' => (string) $team['name'],
                    'questionnaires' => $questionnaires,
                    'eval' => $eval,
                ];
            }
        }

        return $recipients;
    }

    /**
     * @return array{event:string,recipients:int,sent:int,skipped:int,failed:list<string>}
     */
    public function sendScoutReminders(): array
    {
        $people = $this->reminderRecipients();
        $sent = 0;
        $skipped = 0;
        $failed = [];
        foreach ($people as $person) {
            if (empty($person['valid_email'])) {
                $skipped++;
                $failed[] = (($person['name'] !== '' ? $person['name'] : 'Unknown').' (no company email)');
                continue;
            }
            try {
                $this->sendReminderMail($person);
                $sent++;
            } catch (\Throwable) {
                $failed[] = (string) $person['email'];
            }
        }

        return [
            'event' => $this->event()->name,
            'recipients' => count($people),
            'sent' => $sent,
            'skipped' => $skipped,
            'failed' => $failed,
        ];
    }

    /**
     * @param  array<string, mixed>  $person
     */
    private function sendReminderMail(array $person): void
    {
        $event = $this->event()->name;
        $name = $person['name'] !== '' ? $person['name'] : 'there';
        $first = trim((string) explode(' ', $name, 2)[0]);
        $base = rtrim((string) config('app.url'), '/');
        $qUrl = $base.'/ice2027?e='.rawurlencode($this->event()->slug);
        $eUrl = $base.'/ice2027/evaluation?e='.rawurlencode($this->event()->slug);
        $qItems = '';
        foreach ($person['questionnaires'] as $item) {
            $status = ! empty($item['started']) ? 'started, still incomplete' : 'not started';
            $qItems .= '<li><strong>'.e($item['name']).'</strong> — '.$status.'</li>';
        }
        $eval = $person['eval'];
        $htmlQ = $qItems !== '' ? '<p><strong>Questionnaire missing</strong></p><ul>'.$qItems.'</ul>' : '';
        $htmlE = empty($eval['complete'])
            ? '<p><strong>Evaluation missing:</strong> '.e((string) $eval['label']).'. Please fill all '.(int) $eval['required'].' rows.</p>'
            : '';
        $subject = 'MERKURflow: '.$event.' scouting reminder';
        $html = '<p>Hello '.e($first).',<br>your <strong>'.e($event).'</strong> scouting tasks are still open.</p>'
            .$htmlQ.$htmlE
            .'<p><a href="'.e($qUrl).'">Open questionnaire</a> · <a href="'.e($eUrl).'">Open evaluation</a></p>';
        Mail::html($html, function ($message) use ($person, $subject) {
            $message->to((string) $person['email'])->subject($subject);
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return list<array<string, mixed>>
     */
    private function questionnaireProducts(array $payload): array
    {
        $source = $payload;
        if (isset($payload['products']) && is_array($payload['products'])) {
            if (array_is_list($payload['products'])) {
                return array_values(array_filter($payload['products'], fn ($item) => is_array($item) && ! $this->productIsEmpty($item)));
            }
            $source = $payload['products'];
        }

        $out = [];
        foreach (['new' => 'new_product', 'mlp' => 'mlp', 'sap' => 'sap', 'multigame' => 'multigame'] as $section => $category) {
            foreach ($source[$section] ?? [] as $item) {
                if (! is_array($item) || $this->productIsEmpty($item)) {
                    continue;
                }
                $item['is_new_product'] = $section === 'new';
                $item['category'] = (string) ($item['category'] ?? ($section === 'new' ? 'new_product' : $category));
                $out[] = $item;
            }
        }

        return $out;
    }

    /**
     * @param  array<string, mixed>  $product
     * @return list<int>
     */
    private function productGameIds(array $product): array
    {
        $ids = array_map('intval', is_array($product['game_ids'] ?? null) ? $product['game_ids'] : []);
        $gameId = (int) ($product['game_ID'] ?? 0);
        if ($gameId > 0) {
            $ids[] = $gameId;
        }

        return array_values(array_unique(array_filter($ids)));
    }

    /**
     * @param  array<string, mixed>  $product
     */
    private function productDisplayName(array $product): string
    {
        foreach (['game_name', 'theme', 'usp', 'cabinet'] as $field) {
            $value = trim((string) ($product[$field] ?? ''));
            if ($value !== '') {
                return $value;
            }
        }
        $category = (string) ($product['category'] ?? '');

        return self::GAME_TYPES[$category] ?? 'New product';
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function productIsEmpty(array $item): bool
    {
        foreach ($item as $value) {
            if (is_array($value) && $value !== []) {
                return false;
            }
            if (is_string($value) && trim($value) !== '') {
                return false;
            }
            if (is_numeric($value) && (string) $value !== '0' && (string) $value !== '') {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function evaluationRowComplete(array $row): bool
    {
        return $this->evaluationRowState($row)['missing'] === [];
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array{filled: list<string>, missing: list<string>}
     */
    private function evaluationRowState(array $row): array
    {
        $filled = [];
        $missing = [];
        $track = static function (string $field, bool $hasValue) use (&$filled, &$missing): void {
            if ($hasValue) {
                $filled[] = $field;
            } else {
                $missing[] = $field;
            }
        };

        $track('competitor', (int) ($row['competitor_ID'] ?? 0) > 0 || trim((string) ($row['competitor'] ?? '')) !== '');
        $gameName = trim((string) ($row['game_name'] ?? ''));
        $gameId = $this->evaluationRowCatalogGameId($row);
        $track('game', $gameId > 0 || $gameName !== '');
        foreach (array_keys(self::EVAL_CRITERIA) as $field) {
            $score = (int) ($row[$field] ?? 0);
            $track($field, $score >= 1 && $score <= 5);
        }
        $track('would_play', in_array((string) ($row['would_play'] ?? ''), self::WOULD_PLAY, true));

        return ['filled' => $filled, 'missing' => $missing];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<int, list<string>>
     */
    private function incompleteEvaluationRows(array $payload): array
    {
        $incomplete = [];
        foreach (($payload['top5'] ?? []) as $rank => $row) {
            if (! is_array($row)) {
                continue;
            }
            $state = $this->evaluationRowState($row);
            if ($state['filled'] === [] || $state['missing'] === []) {
                continue;
            }
            $incomplete[(int) $rank] = $state['missing'];
        }

        return $incomplete;
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function evaluationRowCatalogGameId(array $row): int
    {
        if ((string) ($row['game_ID'] ?? '') === '__new__') {
            return 0;
        }
        $gameId = (int) ($row['game_ID'] ?? 0);
        if ($gameId < 1 && isset($row['game_ids'][0])) {
            $gameId = (int) $row['game_ids'][0];
        }

        return $gameId;
    }

    private function evaluationFieldLabel(string $field): string
    {
        $labels = ['competitor' => 'Competitor', 'game' => 'Game'] + self::EVAL_CRITERIA + ['would_play' => 'Would you play this game'];

        return $labels[$field] ?? $field;
    }

    /**
     * @param  list<array<string, mixed>>  $competitors
     */
    private function competitorIdFromEvalRow(array $row, array $competitors): int
    {
        $id = (int) ($row['competitor_ID'] ?? 0);
        if ($id > 0) {
            return $id;
        }
        $name = trim((string) ($row['competitor'] ?? ''));
        if ($name === '') {
            return 0;
        }
        foreach ($competitors as $competitor) {
            if (strcasecmp((string) $competitor['name'], $name) === 0) {
                return (int) $competitor['ID'];
            }
        }

        return 0;
    }

    /**
     * @param  list<array<string, mixed>>  $competitors
     * @return array<string, mixed>
     */
    private function sanitizeEvalRow(array $row, array $competitors): array
    {
        $gameId = $this->evaluationRowCatalogGameId($row);
        $gameName = trim((string) ($row['game_name'] ?? ''));
        $scores = ['graphic', 'sound', 'theme', 'mechanics', 'entertainment', 'innovation', 'potential', 'general'];
        $clean = [
            'competitor_ID' => $this->competitorIdFromEvalRow($row, $competitors) ?: null,
            'competitor' => trim((string) ($row['competitor'] ?? '')),
            'game_ID' => $gameId,
            'game_name' => $gameId > 0 ? '' : $gameName,
            'is_new_product' => $this->evaluationIsNewProduct($row) ? 1 : 0,
            'game_type' => $this->evaluationCategory($row),
            'note' => mb_substr(trim((string) ($row['note'] ?? '')), 0, 500),
            'would_play' => in_array(($row['would_play'] ?? ''), self::WOULD_PLAY, true) ? $row['would_play'] : '',
        ];
        foreach ($scores as $field) {
            $value = (string) ($row[$field] ?? '');
            $clean[$field] = in_array($value, ['1', '2', '3', '4', '5'], true) ? $value : '';
        }

        return $clean;
    }

    private function optionalGameType(string $gameType): string
    {
        $gameType = trim($gameType);

        return isset(self::GAME_TYPES[$gameType]) ? $gameType : '';
    }

    private function validatedTeamAssignment(?int $teamId, ?int $competitorId): ?int
    {
        if ($teamId === null || $teamId < 1) {
            return null;
        }

        if (! $this->teamsQuery()->where('ID', $teamId)->exists()) {
            throw new InvalidArgumentException('Team not found.');
        }

        $count = $this->competitorsQuery()
            ->where('team_ID', $teamId)
            ->when($competitorId, fn ($query) => $query->where('ID', '<>', $competitorId))
            ->count();

        if ($count >= self::COMPETITORS_PER_TEAM) {
            throw new InvalidArgumentException('That team already has '.self::COMPETITORS_PER_TEAM.' competitors.');
        }

        return $teamId;
    }

    private function validatedGameType(string $gameType): ?string
    {
        $gameType = trim($gameType);
        if ($gameType === '') {
            return null;
        }
        if (! isset(self::GAME_TYPES[$gameType])) {
            throw new InvalidArgumentException('Unknown game type.');
        }

        return $gameType;
    }

    /**
     * @return \Illuminate\Database\Eloquent\Builder<Ice2027Team>
     */
    private function teamsQuery()
    {
        return Ice2027Team::query()->where('event_ID', $this->eventId());
    }

    /**
     * @return \Illuminate\Database\Eloquent\Builder<Ice2027Competitor>
     */
    private function competitorsQuery()
    {
        return Ice2027Competitor::query()->where('event_ID', $this->eventId());
    }

    public function teamIdForPhoto(User $user, int $competitorId): int
    {
        $competitor = $this->competitorsQuery()->find($competitorId);
        if ($competitor === null) {
            return 0;
        }
        if ($this->canManage($user)) {
            return (int) ($competitor->team_ID ?? 0);
        }
        $team = $this->teamForUser((int) $user->ID);
        if ($team === null || (int) $team['ID'] !== (int) ($competitor->team_ID ?? 0)) {
            return 0;
        }

        return (int) $team['ID'];
    }

    public function productPhotoPath(int $teamId, int $competitorId, string $fileId): ?string
    {
        if ($fileId === '' || str_contains($fileId, '/') || str_contains($fileId, '\\') || str_contains($fileId, '..')) {
            return null;
        }
        $path = rtrim((string) config('merkur.assets_path'), '/').'/scout/'.$this->eventId().'/'.$teamId.'/'.$competitorId.'/'.$fileId;

        return is_file($path) ? $path : null;
    }

    /**
     * @return array{id:string,name:string,url:string}
     */
    public function saveProductPhoto(User $user, int $competitorId, UploadedFile $file): array
    {
        if ($this->competitorForUser((int) $user->ID, $competitorId) === null) {
            throw new InvalidArgumentException('That competitor is not assigned to your team.');
        }
        $team = $this->teamForUser((int) $user->ID);
        if ($team === null) {
            throw new InvalidArgumentException('You are not on a scouting team.');
        }
        if (! $file->isValid()) {
            throw new InvalidArgumentException('The picture could not be uploaded.');
        }
        if ($file->getSize() < 1 || $file->getSize() > 10485760) {
            throw new InvalidArgumentException('Pictures must be between 1 byte and 10 MB.');
        }
        $mime = (string) $file->getMimeType();
        if (! in_array($mime, ['image/jpeg', 'image/png'], true)) {
            throw new InvalidArgumentException('Only JPG and PNG pictures are allowed.');
        }
        $original = basename((string) $file->getClientOriginalName() ?: 'photo.jpg');
        $ext = strtolower((string) pathinfo($original, PATHINFO_EXTENSION));
        if (! in_array($ext, ['jpg', 'jpeg', 'png'], true)) {
            $ext = $mime === 'image/png' ? 'png' : 'jpg';
            $original = 'photo.'.$ext;
        }
        $dir = rtrim((string) config('merkur.assets_path'), '/').'/scout/'.$this->eventId().'/'.(int) $team['ID'].'/'.$competitorId.'/';
        if (! is_dir($dir) && ! @mkdir($dir, 0777, true) && ! is_dir($dir)) {
            throw new RuntimeException('Could not create the picture folder. Check that ASSETS_PATH is writable.');
        }
        $fileId = $user->ID.'~'.time().'~'.bin2hex(random_bytes(3)).'~~'.$original;
        $file->move($dir, $fileId);

        return [
            'id' => $fileId,
            'name' => $original,
            'url' => $this->photoApiPath($competitorId, $fileId),
        ];
    }

    public function deleteProductPhoto(User $user, int $competitorId, string $fileId): void
    {
        if ($this->competitorForUser((int) $user->ID, $competitorId) === null) {
            throw new InvalidArgumentException('That competitor is not assigned to your team.');
        }
        $team = $this->teamForUser((int) $user->ID);
        if ($team === null) {
            throw new InvalidArgumentException('You are not on a scouting team.');
        }
        $path = $this->productPhotoPath((int) $team['ID'], $competitorId, $fileId);
        if ($path) {
            @unlink($path);
        }
    }

    private function photoApiPath(int $competitorId, string $fileId): string
    {
        return '/ice2027/photo?e='.rawurlencode($this->event()->slug)
            .'&c='.$competitorId
            .'&f='.rawurlencode($fileId);
    }

    /**
     * @param  list<array<string, mixed>>  $products
     * @return list<array{id:string,name:string,url:string}>
     */
    private function photosForProductMatch(array $products, int $competitorId, int $gameId, string $gameName, int $teamId): array
    {
        $out = [];
        foreach ($products as $product) {
            $ids = $this->productGameIds($product);
            $name = strtolower($this->productDisplayName($product));
            $matches = ($gameId > 0 && in_array($gameId, $ids, true))
                || ($gameName !== '' && $name === strtolower($gameName));
            if (! $matches) {
                continue;
            }
            $out = array_merge($out, $this->photosFromProduct($product, $competitorId, $teamId));
        }

        return $this->uniquePhotos($out);
    }

    /**
     * @param  array<string, mixed>  $product
     * @return list<array{id:string,name:string,url:string}>
     */
    private function photosFromProduct(array $product, int $competitorId, int $teamId): array
    {
        $out = [];
        foreach ($product['photos'] ?? [] as $photo) {
            if (! is_array($photo) || empty($photo['id'])) {
                continue;
            }
            $fileId = (string) $photo['id'];
            $out[] = [
                'id' => $fileId,
                'name' => (string) ($photo['name'] ?? $fileId),
                'url' => $this->photoApiPath($competitorId, $fileId),
            ];
        }
        unset($teamId);

        return $out;
    }

    /**
     * @param  list<array{id:string,name:string,url:string}>  $photos
     * @return list<array{id:string,name:string,url:string}>
     */
    private function uniquePhotos(array $photos): array
    {
        $seen = [];
        $unique = [];
        foreach ($photos as $photo) {
            if (isset($seen[$photo['id']])) {
                continue;
            }
            $seen[$photo['id']] = true;
            $unique[] = $photo;
        }

        return $unique;
    }

    /**
     * @return array{by_key: array<string, list<array{id:string,name:string,url:string}>>, games: list<array<string, mixed>>}
     */
    private function questionnairePhotoIndex(): array
    {
        $competitors = [];
        foreach ($this->competitors() as $competitor) {
            $competitors[(int) $competitor['ID']] = (string) $competitor['name'];
        }
        $catalog = [];
        foreach ($this->games() as $game) {
            $catalog[(int) $game['ID']] = $game;
        }

        $byKey = [];
        $meta = [];
        $rows = ScoutQuestionnaire::query()
            ->where('event_ID', $this->eventId())
            ->get(['team_ID', 'competitor_ID', 'payload']);

        foreach ($rows as $row) {
            $teamId = (int) $row->team_ID;
            $cid = (int) $row->competitor_ID;
            $decoded = is_array($row->payload) ? $row->payload : [];
            foreach ($this->questionnaireProducts($decoded) as $product) {
                $photos = $this->photosFromProduct($product, $cid, $teamId);
                if ($photos === []) {
                    continue;
                }
                $ids = $this->productGameIds($product);
                $gameName = trim((string) ($product['game_name'] ?? ''));
                $keys = [];
                foreach ($ids as $id) {
                    if ($id > 0) {
                        $keys[] = 'g:'.$id;
                    }
                }
                if ($gameName !== '' || ! empty($product['is_new_product'])) {
                    if ($gameName === '' && $ids !== [] && isset($catalog[$ids[0]])) {
                        $gameName = (string) $catalog[$ids[0]]['name'];
                    }
                    if ($gameName === '') {
                        $gameName = self::GAME_TYPES[(string) ($product['category'] ?? '')] ?? 'New product';
                    }
                    $keys[] = 'n:'.$cid.':'.strtolower($gameName);
                }
                if ($keys === [] && $ids === []) {
                    $keys[] = 'c:'.$cid;
                    if ($gameName === '') {
                        $gameName = self::GAME_TYPES[(string) ($product['category'] ?? '')] ?? 'Product';
                    }
                }
                foreach (array_unique($keys) as $key) {
                    if (! isset($byKey[$key])) {
                        $byKey[$key] = [];
                        $resolvedName = $gameName;
                        $resolvedId = $ids[0] ?? 0;
                        if (str_starts_with($key, 'g:')) {
                            $resolvedId = (int) substr($key, 2);
                            $resolvedName = (string) ($catalog[$resolvedId]['name'] ?? $resolvedName);
                        }
                        $meta[$key] = [
                            'key' => $key,
                            'competitor_ID' => $cid,
                            'competitor' => $competitors[$cid] ?? 'Competitor',
                            'game_ID' => $resolvedId,
                            'game' => $resolvedName,
                            'is_new' => ! empty($product['is_new_product']) || $resolvedId < 1,
                        ];
                    }
                    $byKey[$key] = array_merge($byKey[$key], $photos);
                }
            }
        }

        $games = [];
        foreach ($meta as $key => $info) {
            $unique = $this->uniquePhotos($byKey[$key]);
            $byKey[$key] = $unique;
            $info['photos'] = $unique;
            $info['photo_count'] = count($unique);
            $games[] = $info;
        }
        usort($games, static fn ($a, $b) => [$a['competitor'], $a['game']] <=> [$b['competitor'], $b['game']]);

        return ['by_key' => $byKey, 'games' => $games];
    }

    /**
     * @param  array<int, array<string, mixed>>  $competitors
     * @param  array<int, array<string, mixed>>  $games
     * @return array{key:string,game_ID:int,game:string,competitor_ID:int,competitor:string,game_type:string,is_new_product:bool,would_play:string}
     */
    private function resolveEvaluationGame(array $row, array $competitors, array $games): array
    {
        $gameId = (int) ($row['game_ID'] ?? 0);
        if ($gameId < 1 && isset($row['game_ids'][0])) {
            $gameId = (int) $row['game_ids'][0];
        }
        $competitorId = (int) ($row['competitor_ID'] ?? 0);
        $gameType = $this->evaluationCategory($row);
        $gameName = trim((string) ($row['game_name'] ?? ''));
        $isNew = $this->evaluationIsNewProduct($row);

        if ($gameId > 0 && isset($games[$gameId])) {
            $game = $games[$gameId];
            $competitorId = (int) $game['competitor_ID'];
            $gameName = (string) $game['name'];
            if ($gameType === '') {
                $gameType = $this->evaluationCategory(['game_type' => (string) ($game['game_type'] ?? '')]);
            }
        }

        $competitorName = trim((string) ($row['competitor'] ?? ''));
        if ($competitorId > 0 && isset($competitors[$competitorId])) {
            $competitorName = (string) $competitors[$competitorId]['name'];
        }

        $key = $gameId > 0
            ? 'g:'.$gameId
            : 'n:'.$competitorId.':'.strtolower($gameName !== '' ? $gameName : $gameType);

        return [
            'key' => $key,
            'game_ID' => $gameId,
            'game' => $gameName !== '' ? $gameName : (self::GAME_TYPES[$gameType] ?? 'Untitled game'),
            'competitor_ID' => $competitorId,
            'competitor' => $competitorName !== '' ? $competitorName : 'Unknown competitor',
            'game_type' => $gameType,
            'is_new_product' => $isNew,
            'would_play' => (string) ($row['would_play'] ?? ''),
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function evaluationIsNewProduct(array $row): bool
    {
        if (array_key_exists('is_new_product', $row)) {
            $value = $row['is_new_product'];

            return $value === true || $value === 1 || $value === '1' || $value === 'on';
        }

        return trim((string) ($row['game_type'] ?? '')) === 'new_product';
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function evaluationCategory(array $row): string
    {
        $type = trim((string) ($row['game_type'] ?? ''));

        return isset(self::EVAL_CATEGORIES[$type]) ? $type : '';
    }

    private function progressWhen(mixed $at): string
    {
        if ($at === null || $at === '') {
            return '';
        }
        try {
            return \Illuminate\Support\Carbon::parse($at)->format('d M Y H:i');
        } catch (\Throwable) {
            return (string) $at;
        }
    }

    public function isAttendant(User $user): bool
    {
        if ($user->isSuperuser()) {
            return true;
        }

        return ScoutAttendant::query()
            ->where('event_ID', $this->eventId())
            ->where('user_ID', $user->ID)
            ->exists();
    }

    public function canManage(User $user): bool
    {
        if ($user->isSuperuser()) {
            return true;
        }

        return ScoutAttendant::query()
            ->where('event_ID', $this->eventId())
            ->where('user_ID', $user->ID)
            ->where('may_manage', 1)
            ->exists();
    }

    public function canSee(User $user): bool
    {
        return $this->isAttendant($user) || $this->canManage($user);
    }
}
