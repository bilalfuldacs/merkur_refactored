<?php

namespace App\Services;

use App\Models\GameConcept;
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
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;
use RuntimeException;

class Ice2027Service
{
    public const MAX_TEAMS = 5;

    public const MEMBERS_PER_TEAM = 2;

    public const COMPETITORS_PER_TEAM = 3;

    public const EVAL_REQUIRED_ROWS = 5;

    public const EVAL_MAX_ROWS = 40;

    public const VOTE_THRESHOLD_PCT = 50;

    public const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

    public const VIDEO_MAX_BYTES = 150 * 1024 * 1024;

    public const WOULD_PLAY = ['yes', 'no', 'unsure'];

    public const MECHANICS_OPTIONS = [
        'hold_and_spin' => 'Hold & Spin',
        'perceived_persistence' => 'Perceived Persistence',
        'feature_in_feature' => 'Feature in Feature',
        'cash_collect' => 'Cash Collect',
        'true_persistence' => 'True Persistence',
        'combination_persist_hold' => 'Second Screen Bonus',
    ];

    public const THEME_WORLDS = [
        'Adventure', 'Alchemy', 'Ancient Egypt', 'Ancient Greece', 'Ancient Rome', 'Animals',
        'Asian Prosperity', 'Aztec & Maya', 'Beach & Tropical', 'Beer & Pub', 'Book', 'Buffalo & Prairie',
        'Candy & Sweets', 'Carnival', 'Celtic & Irish Luck', 'Chinese New Year', 'Chilli | Mexican',
        'Christmas & Winter', 'Circus', 'Classic Fruits', 'Diamonds & Gems', 'Dinosaurs', 'Dragons',
        'Fairy Tale', 'Fantasy', 'Farm & Harvest', 'Fishing', 'Gangsters & 1920s', 'Gods & Mythology',
        'Gold Rush', 'Horror', 'Jungle', 'Knights & Castles', 'Luxury & Glamour', 'Magic', 'Mermaids',
        'Music & Rock', 'Norse & Vikings', 'Ocean & Underwater', 'Pirates', 'Retro Vegas', 'Royalty',
        'Safari', 'Samurai & Japan', 'Sci-Fi & Space', 'Sports', 'Steampunk', 'Superheroes', 'Trains',
        'Treasure Hunt', 'Western', 'Wildlife', 'Witches & Wizards', 'Wolves', 'Zombies',
    ];

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
                'open_questionnaire' => $this->isOpenQuestionnaireUser((int) $user->ID),
                'extra_questionnaire' => $this->extraQuestionnaireState((int) $user->ID),
                'superuser' => $user->isSuperuser(),
            ],
            'competitors' => $competitors,
            'all_competitors' => $this->competitors(),
            'all_games' => $this->games(),
            'game_types' => self::GAME_TYPES,
            'mechanics_options' => self::MECHANICS_OPTIONS,
            'theme_worlds' => $this->themeWorlds(),
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
        $competitors = $this->catalogCompetitorsQuery()->orderBy('name')->get(['ID', 'name', 'team_ID']);
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

    /**
     * @param  list<int>  $userIds
     */
    public function addTeam(string $name, array $userIds = [], ?int $createdBy = null): string
    {
        $name = trim($name);
        if ($name === '') {
            throw new InvalidArgumentException('Team name is required.');
        }

        if ($this->teamsQuery()->count() >= self::MAX_TEAMS) {
            throw new InvalidArgumentException('A maximum of '.self::MAX_TEAMS.' scouting teams is allowed.');
        }

        $rawIds = array_map('intval', $userIds);
        $userIds = array_values(array_unique(array_filter($rawIds)));
        if (count(array_filter($rawIds)) !== count($userIds)) {
            throw new InvalidArgumentException('Member 1 and Member 2 must be different people.');
        }
        $this->assertTeamMemberCandidates($userIds);

        $team = Ice2027Team::query()->create([
            'event_ID' => $this->eventId(),
            'name' => $name,
            'created_by' => $createdBy,
            'created_at' => now(),
        ]);

        $teamId = (int) $team->ID;
        if ($teamId < 1) {
            throw new RuntimeException('Team could not be created.');
        }

        if ($userIds !== []) {
            $this->setTeamMembers($teamId, $userIds);
        }

        return 'Team added.';
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

        $rawIds = array_map('intval', $userIds);
        $userIds = array_values(array_unique(array_filter($rawIds)));
        if (count(array_filter($rawIds)) !== count($userIds)) {
            throw new InvalidArgumentException('Member 1 and Member 2 must be different people.');
        }
        $this->assertTeamMemberCandidates($userIds);

        DB::transaction(function () use ($teamId, $userIds): void {
            foreach ($userIds as $userId) {
                Ice2027TeamMember::query()
                    ->where('user_ID', $userId)
                    ->where('event_ID', $this->eventId())
                    ->delete();
            }
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
     * @param  list<int>  $userIds
     */
    private function assertTeamMemberCandidates(array $userIds): void
    {
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
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function competitors(): array
    {
        return $this->catalogCompetitorsQuery()
            ->with('team:ID,name')
            ->withCount('games')
            ->orderBy('name')
            ->get()
            ->map(fn (Ice2027Competitor $competitor) => $this->competitorArray($competitor))
            ->values()
            ->all();
    }

    public function addCompetitor(string $name, ?int $teamId, ?int $createdBy): string
    {
        $name = trim($name);
        if ($name === '') {
            throw new InvalidArgumentException('Competitor name is required.');
        }

        $attrs = [
            'event_ID' => $this->eventId(),
            'name' => $name,
            'team_ID' => $this->validatedTeamAssignment($teamId, null),
            'created_by' => $createdBy,
            'created_at' => now(),
        ];
        if ($this->hasHiddenColumn()) {
            $attrs['hidden'] = false;
        }
        Ice2027Competitor::query()->create($attrs);

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
            ->whereHas('competitor', fn ($query) => $this->applyCatalogCompetitorFilter($query->where('event_ID', $this->eventId())))
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

        return $this->catalogCompetitorsQuery()
            ->with('team:ID,name')
            ->withCount('games')
            ->where('team_ID', $team['ID'])
            ->orderBy('name')
            ->get()
            ->map(fn (Ice2027Competitor $competitor) => $this->competitorArray($competitor))
            ->values()
            ->all();
    }

    public function isScout(int $userId): bool
    {
        return $this->teamForUser($userId) !== null;
    }

    public function isOpenQuestionnaireUser(int $userId): bool
    {
        return $this->competitorsForUser($userId) === [];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function openQuestionnaireBucket(int $userId): ?array
    {
        $query = Ice2027Competitor::query()
            ->with('team:ID,name')
            ->withCount('games')
            ->where('event_ID', $this->eventId())
            ->where('created_by', $userId)
            ->whereNull('team_ID');
        if ($this->hasHiddenColumn()) {
            $query->where(function ($inner) {
                $inner->where('hidden', 1)->orWhereIn('name', ['New product', '__open__']);
            })->orderByDesc('hidden')->orderBy('ID');
        } else {
            $query->whereIn('name', ['New product', '__open__'])->orderBy('ID');
        }
        $row = $query->first();

        return $row ? $this->competitorArray($row) : null;
    }

    /**
     * @return array<string, mixed>
     */
    public function ensureOpenQuestionnaireBucket(int $userId): array
    {
        $existing = $this->openQuestionnaireBucket($userId);
        if ($existing !== null) {
            if ($this->hasHiddenColumn() && (empty($existing['hidden']) || $this->isStorageCompetitorName((string) ($existing['name'] ?? '')))) {
                Ice2027Competitor::query()
                    ->where('ID', $existing['ID'])
                    ->where('event_ID', $this->eventId())
                    ->update(['hidden' => 1, 'name' => '__open__']);
                $existing['hidden'] = true;
                $existing['name'] = '__open__';
            }

            return $existing;
        }

        $attrs = [
            'event_ID' => $this->eventId(),
            'name' => '__open__',
            'team_ID' => null,
            'created_by' => $userId,
            'created_at' => now(),
        ];
        if ($this->hasHiddenColumn()) {
            $attrs['hidden'] = true;
        }
        $created = Ice2027Competitor::query()->create($attrs);

        return $this->competitorArray($created->fresh(['team'])->loadCount('games'));
    }

    /**
     * @return array<string, mixed>|null
     */
    public function competitorAccessibleToUser(int $userId, int $competitorId): ?array
    {
        $assigned = $this->competitorForUser($userId, $competitorId);
        if ($assigned !== null && empty($assigned['hidden']) && ! $this->isStorageCompetitorName((string) $assigned['name'])) {
            return $assigned;
        }
        $bucket = $this->openQuestionnaireBucket($userId);
        if ($bucket !== null && (int) $bucket['ID'] === $competitorId) {
            return $bucket;
        }

        return null;
    }

    /**
     * @return array{started:bool,complete:bool,products:int,covered:int,catalog:int,new_products:int,bucket_ID:int}
     */
    public function extraQuestionnaireState(int $userId): array
    {
        $empty = [
            'started' => false,
            'complete' => false,
            'products' => 0,
            'covered' => 0,
            'catalog' => 0,
            'new_products' => 0,
            'bucket_ID' => 0,
        ];
        $bucket = $this->openQuestionnaireBucket($userId);
        if ($bucket === null) {
            return $empty;
        }
        $state = $this->questionnaireCoverage($this->personalQuestionnairePayload($userId, (int) $bucket['ID']), []);
        $state['bucket_ID'] = (int) $bucket['ID'];

        return $state;
    }

    /**
     * @return list<string>
     */
    public function themeWorlds(): array
    {
        $out = self::THEME_WORLDS;
        $seen = [];
        foreach ($out as $theme) {
            $seen[strtolower($theme)] = true;
        }
        foreach (['game_concepts', 'games'] as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'theme')) {
                continue;
            }
            $rows = DB::table($table)
                ->select('theme')
                ->whereNotNull('theme')
                ->whereRaw("TRIM(theme) <> ''")
                ->distinct()
                ->orderBy('theme')
                ->pluck('theme');
            foreach ($rows as $value) {
                $theme = trim((string) $value);
                $key = strtolower($theme);
                if ($theme === '' || isset($seen[$key])) {
                    continue;
                }
                $out[] = $theme;
                $seen[$key] = true;
            }
        }
        natcasesort($out);

        return array_values($out);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function saveQuestionnaire(int $userId, int $competitorId, array $payload, bool $open = false): string
    {
        if ($open || $this->isOpenQuestionnaireUser($userId)) {
            $bucket = $this->ensureOpenQuestionnaireBucket($userId);
            $competitorId = (int) $bucket['ID'];
            $open = true;
        }
        $competitor = $this->competitorAccessibleToUser($userId, $competitorId);
        if ($competitor === null) {
            throw new InvalidArgumentException('That competitor is not available for your questionnaire.');
        }

        $incoming = isset($payload['new']) || isset($payload['mlp']) || isset($payload['products'])
            ? $payload
            : ['products' => $payload];
        $store = ['products' => $this->questionnaireProducts($incoming)];
        $isStorage = $open || ! empty($competitor['hidden']) || $this->isStorageCompetitorName((string) ($competitor['name'] ?? ''));

        if ($isStorage) {
            $this->assertOpenQuestionnairePayload($store);
            Ice2027Questionnaire::query()->updateOrCreate(
                ['user_ID' => $userId, 'competitor_ID' => $competitorId],
                ['payload' => $store, 'submitted_at' => now()],
            );

            return 'Questionnaire saved.';
        }

        $team = $this->teamForUser($userId);
        if ($team === null) {
            throw new InvalidArgumentException('You are not on a scouting team.');
        }

        $store = $this->applyProductCompetitorNames($store, (string) ($competitor['name'] ?? ''));
        if ($this->isNewProductOnlyQuestionnaire($competitor, true)) {
            $this->assertNewProductOnlyPayload($store);
        }
        $this->assertCabinetProductPayload($store);
        $this->assertUniqueCatalogGames($store);

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
        $competitor = $this->competitorAccessibleToUser($userId, $competitorId);
        $isStorage = $competitor !== null && (
            ! empty($competitor['hidden']) || $this->isStorageCompetitorName((string) ($competitor['name'] ?? ''))
        );
        if ($isStorage || $team === null) {
            return $this->personalQuestionnairePayload($userId, $competitorId);
        }

        $row = ScoutQuestionnaire::query()
            ->where('event_ID', $this->eventId())
            ->where('team_ID', $team['ID'])
            ->where('competitor_ID', $competitorId)
            ->first();

        if ($row === null || $this->questionnaireProducts(is_array($row->payload) ? $row->payload : []) === []) {
            $personal = $this->personalQuestionnairePayload($userId, $competitorId);
            if ($personal !== []) {
                return $personal;
            }
        }

        return is_array($row?->payload) ? $row->payload : [];
    }

    /**
     * @return array<string, mixed>
     */
    public function questionnaireView(User $user, int $competitorId, bool $open = false): array
    {
        if ($open || $this->isOpenQuestionnaireUser((int) $user->ID)) {
            $assigned = $this->ensureOpenQuestionnaireBucket((int) $user->ID);
            $competitorId = (int) $assigned['ID'];
            $open = true;
        } else {
            $assigned = $this->competitorAccessibleToUser((int) $user->ID, $competitorId);
            if ($assigned === null) {
                throw new InvalidArgumentException('That competitor is not assigned to you.');
            }
            $open = ! empty($assigned['hidden']) || $this->isStorageCompetitorName((string) ($assigned['name'] ?? ''));
        }

        $team = $this->teamForUser((int) $user->ID);
        $teamId = (int) ($team['ID'] ?? 0);
        $raw = $this->questionnairePayload((int) $user->ID, $competitorId);
        $owner = $this->mediaOwnerForUser((int) $user->ID);
        $products = array_map(function (array $product) use ($competitorId, $owner) {
            $product['photos'] = $this->photosFromProduct($product, $competitorId, $owner);

            return $product;
        }, $this->questionnaireProducts($raw));

        $games = array_values(array_filter(
            $this->games(),
            fn (array $game) => (int) $game['competitor_ID'] === $competitorId
        ));
        $catalogIds = array_map(fn (array $game) => (int) $game['ID'], $games);
        $coverage = $this->questionnaireCoverage(['products' => $products], $open ? [] : $catalogIds);
        $forceNew = $this->isNewProductOnlyQuestionnaire($assigned, $team !== null);

        $row = (! $open && $teamId > 0)
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
        if (! $open && $teamId > 0) {
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

        $displayCompetitor = $assigned;
        if ($open) {
            $displayCompetitor = [
                ...$assigned,
                'name' => 'Any competitor',
                'questionnaire_started' => ! empty($coverage['started']),
                'questionnaire_done' => ! empty($coverage['complete']),
            ];
        }

        return [
            'competitor' => $displayCompetitor,
            'products' => $products,
            'games' => $open ? $this->games() : $games,
            'all_competitors' => $this->competitors(),
            'all_games' => $this->games(),
            'game_types' => self::GAME_TYPES,
            'mechanics_options' => self::MECHANICS_OPTIONS,
            'theme_worlds' => $this->themeWorlds(),
            'open' => $open,
            'need_competitor_name' => $open,
            'force_new_product' => $forceNew && ! $open,
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
        $catalogById = [];
        foreach ($this->competitors() as $competitor) {
            $catalogById[(int) $competitor['ID']] = $competitor;
        }
        $gamesCatalog = [];
        foreach ($this->games() as $game) {
            $gamesCatalog[(int) $game['ID']] = $game;
        }
        foreach (($payload['top5'] ?? []) as $rank => $row) {
            if (! is_array($row) || $this->evaluationRowState($row)['missing'] !== []) {
                continue;
            }
            $resolved = $this->resolveEvaluationGame($row, $catalogById, $gamesCatalog);
            $dupKey = $resolved['key'];
            if (isset($seenGames[$dupKey])) {
                $errors[] = 'You already rated that game in row '.$seenGames[$dupKey].'. Pick a different game in row '.(int) $rank.'.';
            } else {
                $seenGames[$dupKey] = (int) $rank;
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
        $saved = $payload['top5'] ?? [];
        if (! is_array($saved)) {
            $saved = [];
        }

        $count = $this->evaluationSavedRowCount($saved);
        $rows = [];
        for ($rank = 1; $rank <= $count; $rank++) {
            $rows[$rank] = $this->evaluationRowFromSaved($saved, $rank);
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
                for ($rank = 1; $rank <= $count; $rank++) {
                    if ($this->competitorIdFromEvalRow($rows[$rank], $competitors) < 1 && trim((string) ($rows[$rank]['competitor'] ?? '')) === '') {
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
        $count = $this->evaluationSavedRowCount($saved);
        $top5 = [];
        for ($rank = 1; $rank <= $count; $rank++) {
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
            $label = 'Done';
            $detail = $rows > $required
                ? 'You have rated '.$rows.' games. You can still add more or edit your evaluation.'
                : 'You have rated '.$required.' games. You can still add more rows or edit your evaluation.';
        } elseif ($started) {
            $label = $rows.'/'.$required.' games rated';
            $detail = 'You have rated '.$rows.' of '.$required.' required games. Fill at least '.$required.' rows to complete your evaluation. You can add more rows if you need them.';
        } else {
            $label = 'Not started';
            $detail = 'Rate at least '.$required.' games. Start with '.$required.' rows and add more if you want. Evaluation is complete when at least '.$required.' rows are filled.';
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
        $teamPool = 0;
        foreach ($teams as $team) {
            $teamPool += count($team['members']);
        }
        $attendantPool = 0;
        foreach ($this->activeUsers() as $person) {
            if (! empty($person['iceattendent2027']) && ! isset($teamByUser[(int) $person['ID']])) {
                $attendantPool++;
            }
        }

        $allRatings = [];
        $evals = Ice2027Evaluation::query()
            ->where('event_ID', $this->eventId())
            ->with('user:ID,firstname,lastname,username')
            ->get();

        foreach ($evals as $eval) {
            $payload = is_array($eval->payload) ? $eval->payload : [];
            $userId = (int) $eval->user_ID;
            $raterTeam = $teamByUser[$userId] ?? null;
            $source = $raterTeam ? 'teams' : 'attendants';
            foreach (($payload['top5'] ?? []) as $rank => $row) {
                if (! is_array($row) || ! $this->evaluationRowComplete($row)) {
                    continue;
                }
                $resolved = $this->resolveEvaluationGame($row, $competitors, $gamesCatalog);
                if ((int) $resolved['game_ID'] > 0 && ! isset($gamesCatalog[(int) $resolved['game_ID']])) {
                    continue;
                }
                if ((int) $resolved['competitor_ID'] > 0 && ! isset($competitors[(int) $resolved['competitor_ID']])) {
                    continue;
                }
                if ($this->isStorageCompetitorName((string) $resolved['competitor'])) {
                    continue;
                }
                $scores = [];
                foreach ($criteria as $field) {
                    $scores[$field] = (int) $row[$field];
                }
                $allRatings[] = [
                    'user_ID' => $userId,
                    'rater' => $eval->user?->displayName() ?: (string) ($eval->user?->username ?? ''),
                    'team_ID' => (int) ($raterTeam['ID'] ?? 0),
                    'team' => (string) ($raterTeam['name'] ?? ''),
                    'source' => $source,
                    'rank' => (int) $rank,
                    'submitted_at' => optional($eval->submitted_at)?->toDateTimeString(),
                    'scores' => $scores,
                    'average' => array_sum($scores) / max(1, count($scores)),
                ] + $resolved;
            }
        }

        $groups = [];
        foreach ($allRatings as $rating) {
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
                    'teams' => $this->emptyEvalBucket(),
                    'attendants' => $this->emptyEvalBucket(),
                ];
            }
            $bucket = $rating['source'] === 'attendants' ? 'attendants' : 'teams';
            $groups[$key][$bucket]['ratings']++;
            $groups[$key][$bucket]['voters'][$rating['user_ID']] = true;
            $groups[$key][$bucket]['rank_sum'] += $rating['rank'];
            $groups[$key][$bucket]['total'] += $rating['average'];
            if ($rating['rank'] === 1) {
                $groups[$key][$bucket]['rank1']++;
            }
            if ($rating['would_play'] === 'yes') {
                $groups[$key][$bucket]['play_yes']++;
            } elseif ($rating['would_play'] === 'no') {
                $groups[$key][$bucket]['play_no']++;
            } elseif ($rating['would_play'] === 'unsure') {
                $groups[$key][$bucket]['play_unsure']++;
            }
            foreach ($rating['scores'] as $field => $score) {
                $groups[$key][$bucket]['score_sums'][$field] += $score;
            }
        }

        $coverageByKey = [];
        foreach ($groups as $key => $group) {
            $coverageByKey[$key] = $this->voteCoverage(count($group['teams']['voters']), $teamPool);
        }

        $displayRatings = [];
        $seenSubmissions = [];
        $seenFloor = [];
        foreach ($allRatings as $rating) {
            if ($rating['source'] === 'teams') {
                $seenSubmissions[$rating['user_ID']] = true;
            } else {
                $seenFloor[$rating['user_ID']] = true;
            }
            if ($filterTeam > 0 && $rating['source'] === 'teams' && $rating['team_ID'] !== $filterTeam) {
                continue;
            }
            if ($filterTeam > 0 && $rating['source'] === 'attendants') {
                continue;
            }
            if (! $this->matchesCompetitorFilter($rating, 0, $filterCompetitor, $competitors)) {
                continue;
            }
            if ($filterType !== '' && (string) $rating['game_type'] !== $filterType) {
                continue;
            }
            if ($filterPlay !== '' && (string) $rating['would_play'] !== $filterPlay) {
                continue;
            }
            $displayRatings[] = $rating + ($coverageByKey[$rating['key']] ?? $this->voteCoverage(0, $teamPool));
        }

        $games = [];
        foreach ($groups as $group) {
            $team = $this->evalBucketStats($group['teams']);
            $floor = $this->evalBucketStats($group['attendants']);
            if ($team['ratings'] < 1 && $floor['ratings'] < 1) {
                continue;
            }
            $coverage = $coverageByKey[$group['key']] ?? $this->voteCoverage(0, $teamPool);
            $hasOfficial = $team['ratings'] > 0 && empty($coverage['below_threshold']);
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
                'ratings' => $team['ratings'],
                'voters' => $team['voters'],
                'rank1' => $team['rank1'],
                'avg_rank' => $team['avg_rank'],
                'average' => $team['average'],
                'averages' => $team['averages'],
                'play_yes' => $team['play_yes'],
                'play_no' => $team['play_no'],
                'play_unsure' => $team['play_unsure'],
                'play_pct' => $team['play_pct'],
                'has_official' => $hasOfficial,
                'rank_score' => $team['ratings'] > 0
                    ? $this->evaluationRankScore($team['average'], (float) $coverage['vote_pct'])
                    : 0.0,
                'floor_average' => $floor['average'],
                'floor_averages' => $floor['averages'],
                'floor_ratings' => $floor['ratings'],
                'floor_voters' => $floor['voters'],
                'floor_play_pct' => $floor['play_pct'],
                'floor_play_yes' => $floor['play_yes'],
                'floor_play_no' => $floor['play_no'],
                'floor_play_unsure' => $floor['play_unsure'],
            ] + $coverage;
        }

        usort($games, static function (array $a, array $b): int {
            return [
                $b['rank_score'],
                $b['vote_pct'],
                $b['average'],
                $b['floor_average'],
                $a['game'],
            ] <=> [
                $a['rank_score'],
                $a['vote_pct'],
                $a['average'],
                $a['floor_average'],
                $b['game'],
            ];
        });
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

        $displayGames = [];
        foreach ($games as $game) {
            if (! $this->matchesCompetitorFilter($game, 0, $filterCompetitor, $competitors)) {
                continue;
            }
            if ($filterType !== '' && (string) $game['game_type'] !== $filterType) {
                continue;
            }
            $displayGames[] = $game;
        }

        $byCriterion = [];
        foreach (self::EVAL_CRITERIA as $field => $label) {
            $best = null;
            foreach ($displayGames as $game) {
                if (empty($game['has_official'])) {
                    continue;
                }
                if ($best === null || $game['averages'][$field] > $best['averages'][$field]) {
                    $best = $game;
                }
            }
            $byCriterion[$field] = $best;
        }

        $byType = [];
        foreach ($displayGames as $game) {
            if (empty($game['has_official']) || $game['ratings'] < 1) {
                continue;
            }
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

        $official = array_values(array_filter($displayGames, static fn ($game) => ! empty($game['has_official'])));
        $teamRatingRows = array_values(array_filter($allRatings, static fn ($row) => $row['source'] === 'teams'));
        $playYes = count(array_filter($teamRatingRows, static fn ($row) => $row['would_play'] === 'yes'));

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
                'submissions' => count($seenSubmissions),
                'ratings' => count($teamRatingRows),
                'games' => count($games),
                'official_games' => count($official),
                'play_yes' => $playYes,
                'play_pct' => $teamRatingRows !== [] ? ($playYes / count($teamRatingRows)) * 100 : 0,
                'floor_ratings' => count($allRatings) - count($teamRatingRows),
                'floor_people' => count($seenFloor),
                'team_pool' => $teamPool,
                'attendant_pool' => $attendantPool,
                'threshold_pct' => self::VOTE_THRESHOLD_PCT,
            ],
            'winner' => $displayGames[0] ?? null,
            'games' => $displayGames,
            'official' => $official,
            'by_criterion' => $byCriterion,
            'by_type' => array_values($byType),
            'ratings' => $displayRatings,
            'photo_games' => $photoIndex['games'],
            'team_pool' => $teamPool,
            'threshold_pct' => self::VOTE_THRESHOLD_PCT,
        ];
    }

    /**
     * Assigned / new-product questionnaire dashboard (scout + personal legacy).
     *
     * @param  array{team_ID?:int,competitor_ID?:int,game_type?:string}  $filters
     * @return array<string, mixed>
     */
    public function questionnaireDashboard(array $filters = []): array
    {
        $competitors = [];
        foreach ($this->competitors() as $competitor) {
            $competitors[(int) $competitor['ID']] = $competitor;
        }
        $gamesCatalog = [];
        foreach ($this->games() as $game) {
            $gamesCatalog[(int) $game['ID']] = $game;
        }

        $memberNamesByTeam = [];
        $teamNameById = [];
        $teamByUser = [];
        foreach ($this->teams() as $team) {
            $teamId = (int) $team['ID'];
            $teamNameById[$teamId] = (string) $team['name'];
            $names = [];
            foreach ($team['members'] as $member) {
                $name = trim((string) ($member['name'] ?? ''));
                if ($name !== '') {
                    $names[] = $name;
                }
                $teamByUser[(int) $member['user_ID']] = [
                    'ID' => $teamId,
                    'name' => (string) $team['name'],
                ];
            }
            $memberNamesByTeam[$teamId] = $names;
        }

        $allCompetitors = [];
        $competitorColumns = ['ID', 'name', 'team_ID'];
        if ($this->hasHiddenColumn()) {
            $competitorColumns[] = 'hidden';
        }
        foreach ($this->competitorsQuery()->get($competitorColumns) as $row) {
            $allCompetitors[(int) $row->ID] = $this->competitorArray($row);
        }

        $filterTeam = (int) ($filters['team_ID'] ?? 0);
        $filterCompetitor = (int) ($filters['competitor_ID'] ?? 0);
        $filterType = trim((string) ($filters['game_type'] ?? ''));
        $photoIndex = $this->questionnairePhotoIndex();

        $groups = [];
        $add = function (array $resolved, string $teamName, array $people) use (&$groups, $photoIndex): void {
            $key = (string) $resolved['key'];
            if (! isset($groups[$key])) {
                $photos = $photoIndex['by_key'][$key] ?? [];
                $groups[$key] = [
                    'key' => $key,
                    'game_ID' => $resolved['game_ID'],
                    'game' => $resolved['game'],
                    'competitor_ID' => $resolved['competitor_ID'],
                    'competitor' => $resolved['competitor'],
                    'game_type' => $resolved['game_type'],
                    'is_new_product' => ! empty($resolved['is_new_product']) || (int) $resolved['game_ID'] < 1,
                    'teams' => [],
                    'filled_by' => [],
                    'photos' => $photos,
                    'photo_count' => count($photos),
                ];
            }
            $teamName = trim($teamName);
            if ($teamName !== '') {
                $groups[$key]['teams'][$teamName] = $teamName;
            }
            foreach ($people as $person) {
                $person = trim((string) $person);
                if ($person !== '') {
                    $groups[$key]['filled_by'][$person] = $person;
                }
            }
        };

        foreach (
            ScoutQuestionnaire::query()
                ->where('event_ID', $this->eventId())
                ->get(['team_ID', 'competitor_ID', 'payload']) as $row
        ) {
            $teamId = (int) $row->team_ID;
            if ($filterTeam > 0 && $teamId !== $filterTeam) {
                continue;
            }
            $payload = is_array($row->payload) ? $row->payload : [];
            $teamName = $teamNameById[$teamId] ?? 'Team';
            $competitorId = (int) $row->competitor_ID;
            $compMeta = $allCompetitors[$competitorId] ?? null;
            $hiddenComp = $compMeta && (
                ! empty($compMeta['hidden']) || $this->isStorageCompetitorName((string) ($compMeta['name'] ?? ''))
            );
            foreach ($this->questionnaireProducts($payload) as $product) {
                $resolved = $this->resolveQuestionnaireProduct($product, $competitorId, $competitors, $gamesCatalog);
                if ($hiddenComp && (int) $resolved['game_ID'] < 1) {
                    $resolved['is_new_product'] = true;
                }
                if (! $this->matchesCompetitorFilter($resolved, $competitorId, $filterCompetitor, $competitors)) {
                    continue;
                }
                if ($filterType !== '' && $resolved['game_type'] !== $filterType) {
                    continue;
                }
                $add($resolved, $teamName, $memberNamesByTeam[$teamId] ?? []);
            }
        }

        foreach (
            Ice2027Questionnaire::query()
                ->with('user:ID,firstname,lastname,username')
                ->whereHas('competitor', fn ($query) => $query->where('event_ID', $this->eventId()))
                ->get() as $row
        ) {
            $userId = (int) $row->user_ID;
            $raterTeam = $teamByUser[$userId] ?? null;
            $teamId = (int) ($raterTeam['ID'] ?? 0);
            if ($filterTeam > 0 && $teamId !== $filterTeam) {
                continue;
            }
            $payload = is_array($row->payload) ? $row->payload : [];
            $person = $row->user?->displayName() ?: (string) ($row->user?->username ?? '');
            $teamName = (string) ($raterTeam['name'] ?? '');
            $people = $teamId > 0 ? ($memberNamesByTeam[$teamId] ?? [$person]) : [$person];
            $competitorId = (int) $row->competitor_ID;
            $compMeta = $allCompetitors[$competitorId] ?? null;
            $hiddenComp = $compMeta && (
                ! empty($compMeta['hidden']) || $this->isStorageCompetitorName((string) ($compMeta['name'] ?? ''))
            );
            foreach ($this->questionnaireProducts($payload) as $product) {
                $resolved = $this->resolveQuestionnaireProduct($product, $competitorId, $competitors, $gamesCatalog);
                if ($hiddenComp && (int) $resolved['game_ID'] < 1) {
                    $resolved['is_new_product'] = true;
                }
                if (! $this->matchesCompetitorFilter($resolved, $competitorId, $filterCompetitor, $competitors)) {
                    continue;
                }
                if ($filterType !== '' && $resolved['game_type'] !== $filterType) {
                    continue;
                }
                $add($resolved, $teamName, $people);
            }
        }

        $assigned = [];
        $newProducts = [];
        foreach ($groups as $item) {
            $item['teams'] = array_values($item['teams']);
            $item['filled_by'] = array_values($item['filled_by']);
            if (! empty($item['is_new_product'])) {
                $newProducts[] = $item;
            } else {
                $assigned[] = $item;
            }
        }
        usort($assigned, static fn ($a, $b) => [$a['competitor'], $a['game']] <=> [$b['competitor'], $b['game']]);
        usort($newProducts, static fn ($a, $b) => [$a['competitor'], $a['game']] <=> [$b['competitor'], $b['game']]);

        return [
            'event' => [
                'ID' => $this->eventId(),
                'slug' => $this->event()->slug,
                'name' => $this->event()->name,
            ],
            'game_types' => self::GAME_TYPES,
            'competitors' => array_map(
                fn (array $competitor) => ['ID' => (int) $competitor['ID'], 'name' => (string) $competitor['name']],
                $this->competitors()
            ),
            'stats' => [
                'assigned' => count($assigned),
                'new_products' => count($newProducts),
                'photos' => count($photoIndex['games']),
            ],
            'assigned' => $assigned,
            'new_products' => $newProducts,
            'photo_games' => $photoIndex['games'],
            'games' => $assigned,
            'rows' => [],
        ];
    }

    /**
     * @param  array<int, array>  $competitors
     * @param  array<int, array>  $games
     * @return array{key:string,game_ID:int,game:string,competitor_ID:int,competitor:string,game_type:string,is_new_product:bool,would_play:string}
     */
    private function resolveQuestionnaireProduct(array $product, int $competitorId, array $competitors, array $games): array
    {
        $row = $product;
        $visibleBucket = $competitorId > 0
            && isset($competitors[$competitorId])
            && ! $this->competitorRowIsStorage($competitors[$competitorId]);
        $typedName = trim((string) ($product['competitor_name'] ?? $product['competitor'] ?? ''));
        $productCompId = (int) ($row['competitor_ID'] ?? 0);
        if ($productCompId > 0 && (
            ! isset($competitors[$productCompId]) || $this->competitorRowIsStorage($competitors[$productCompId])
        )) {
            $row['competitor_ID'] = 0;
        }
        if ($typedName !== '') {
            $row['competitor'] = $typedName;
        } elseif ($visibleBucket) {
            $row['competitor'] = (string) $competitors[$competitorId]['name'];
            if ((int) ($row['competitor_ID'] ?? 0) < 1) {
                $row['competitor_ID'] = $competitorId;
            }
        }
        $category = trim((string) ($product['category'] ?? $product['game_type'] ?? ''));
        if ($category !== '') {
            $row['game_type'] = $category;
        }
        $resolved = $this->resolveEvaluationGame($row, $competitors, $games);
        if ($resolved['game_type'] === '' && $category !== '') {
            $resolved['game_type'] = $category;
        }
        $sameAsBucket = $visibleBucket && (
            $typedName === '' || strcasecmp($typedName, (string) $competitors[$competitorId]['name']) === 0
        );
        if ($sameAsBucket && (int) $resolved['competitor_ID'] < 1) {
            $resolved['competitor_ID'] = $competitorId;
            $resolved['competitor'] = (string) $competitors[$competitorId]['name'];
        }

        return $resolved;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function evaluationGameDetail(string $key): ?array
    {
        $key = trim($key);
        if ($key === '') {
            return null;
        }
        $dash = $this->evaluationDashboard();
        $game = null;
        foreach ($dash['games'] as $row) {
            if ((string) ($row['key'] ?? '') === $key) {
                $game = $row;
                break;
            }
        }
        if ($game === null) {
            return null;
        }
        $ratings = array_values(array_filter(
            $dash['ratings'],
            static fn ($row) => (string) ($row['key'] ?? '') === $key
        ));
        $teamRatings = [];
        $floorRatings = [];
        foreach ($ratings as $row) {
            if (($row['source'] ?? '') === 'attendants') {
                $floorRatings[] = $row;
            } else {
                $teamRatings[] = $row;
            }
        }

        return [
            'event' => $dash['event'],
            'criteria' => $dash['criteria'],
            'game' => $game,
            'ratings' => $ratings,
            'team_ratings' => $teamRatings,
            'floor_ratings' => $floorRatings,
            'stats' => $dash['stats'],
            'team_pool' => (int) ($dash['team_pool'] ?? 0),
            'threshold_pct' => (int) ($dash['threshold_pct'] ?? self::VOTE_THRESHOLD_PCT),
        ];
    }

    /**
     * @return array{filename:string,binary:string}
     */
    public function dashboardExcel(string $kind = 'all'): array
    {
        $kind = strtolower(trim($kind));
        $slug = preg_replace('/[^a-z0-9]+/i', '-', $this->event()->slug) ?: 'event';

        $qHeader = [
            'Source', 'Team', 'Filled by', 'Saved at', 'Competitor', 'Game', 'New product', 'Category',
            'Progressive JP', 'Progressives', 'Static', 'No. of pots', 'Mechanics', 'Mechanics description',
            'Win-lines', 'Denomination', 'Bets', 'Theme', 'Cabinet', 'Target market', 'USP',
            'Integrated JP', 'Integrated JP number', 'Number of categories', 'Number of games',
            'Number of monitors', 'Monitor size', 'UHD', 'Video Button Panel', 'VBP functions', 'Pictures',
        ];
        $qRows = array_merge([$qHeader], $this->questionnaireExcelProductRows());

        if ($kind === 'questionnaire' || $kind === 'questionnaires') {
            return [
                'filename' => $slug.'-questionnaires.xlsx',
                'binary' => $this->xlsxBinary([
                    ['name' => 'Questionnaires', 'rows' => $qRows],
                ]),
            ];
        }

        $dash = $this->evaluationDashboard();
        $header = ['Rater', 'From', 'Team', 'Competitor', 'Game', 'Type', 'New product'];
        foreach (self::EVAL_CRITERIA as $label) {
            $header[] = $label;
        }
        $header[] = 'Avg';
        $header[] = 'Would play';
        $header[] = 'Voted %';
        $rows = [$header];
        foreach ($dash['ratings'] as $rating) {
            $fromTeam = ($rating['source'] ?? '') !== 'attendants';
            $type = (string) ($rating['game_type'] ?? '');
            $row = [
                (string) $rating['rater'],
                $fromTeam ? 'Scouting team' : 'Attendant',
                $fromTeam && trim((string) ($rating['team'] ?? '')) !== '' ? (string) $rating['team'] : '—',
                (string) $rating['competitor'],
                (string) $rating['game'],
                self::GAME_TYPES[$type] ?? ($type !== '' ? $type : '—'),
                ! empty($rating['is_new_product']) ? 'Yes' : 'No',
            ];
            foreach (array_keys(self::EVAL_CRITERIA) as $field) {
                $row[] = (int) ($rating['scores'][$field] ?? 0);
            }
            $row[] = round((float) $rating['average'], 2);
            $row[] = match ((string) ($rating['would_play'] ?? '')) {
                'yes' => 'Yes',
                'no' => 'No',
                'unsure' => 'Unsure',
                default => '—',
            };
            if ($fromTeam) {
                $pct = number_format((float) ($rating['vote_pct'] ?? 0), 0);
                $voters = (int) ($rating['team_voters'] ?? 0);
                $pool = (int) ($rating['team_pool'] ?? 0);
                $row[] = $pct.'% ('.$voters.'/'.$pool.' members)';
            } else {
                $row[] = '—';
            }
            $rows[] = $row;
        }

        if ($kind === 'evaluation' || $kind === 'ratings') {
            return [
                'filename' => $slug.'-all-ratings.xlsx',
                'binary' => $this->xlsxBinary([
                    ['name' => 'All ratings', 'rows' => $rows],
                ]),
            ];
        }

        return [
            'filename' => $slug.'-all-ratings.xlsx',
            'binary' => $this->xlsxBinary([
                ['name' => 'All ratings', 'rows' => $rows],
                ['name' => 'Questionnaires', 'rows' => $qRows],
            ]),
        ];
    }

    /**
     * @return list<list<mixed>>
     */
    private function questionnaireExcelProductRows(): array
    {
        $competitors = [];
        foreach ($this->competitors() as $competitor) {
            $competitors[(int) $competitor['ID']] = $competitor;
        }
        $gamesCatalog = [];
        foreach ($this->games() as $game) {
            $gamesCatalog[(int) $game['ID']] = $game;
        }
        $roster = [];
        $teamByUser = [];
        foreach ($this->teams() as $team) {
            $names = [];
            foreach ($team['members'] as $member) {
                $name = trim((string) ($member['name'] ?? ''));
                if ($name !== '') {
                    $names[] = $name;
                }
                $teamByUser[(int) $member['user_ID']] = [
                    'ID' => (int) $team['ID'],
                    'name' => (string) $team['name'],
                ];
            }
            $roster[(int) $team['ID']] = ['name' => (string) $team['name'], 'people' => $names];
        }
        $out = [];
        foreach (
            ScoutQuestionnaire::query()
                ->with('updater:ID,firstname,lastname,username')
                ->where('event_ID', $this->eventId())
                ->orderBy('updated_at')
                ->get() as $row
        ) {
            $payload = is_array($row->payload) ? $row->payload : [];
            $teamId = (int) $row->team_ID;
            $teamName = $roster[$teamId]['name'] ?? 'Team';
            $people = $roster[$teamId]['people'] ?? [];
            $savedBy = $row->updater?->displayName() ?: (string) ($row->updater?->username ?? '');
            $savedAt = optional($row->updated_at)->format('Y-m-d H:i') ?? '';
            foreach ($this->questionnaireProducts($payload) as $product) {
                $out[] = $this->questionnaireExcelRow($product, (int) $row->competitor_ID, $competitors, $gamesCatalog, 'Scouting team', $teamName, $people !== [] ? implode(', ', $people) : $savedBy, $savedAt);
            }
        }

        foreach (
            Ice2027Questionnaire::query()
                ->with('user:ID,firstname,lastname,username')
                ->whereHas('competitor', fn ($query) => $query->where('event_ID', $this->eventId()))
                ->orderBy('submitted_at')
                ->get() as $row
        ) {
            $payload = is_array($row->payload) ? $row->payload : [];
            $userId = (int) $row->user_ID;
            $raterTeam = $teamByUser[$userId] ?? null;
            $teamName = (string) ($raterTeam['name'] ?? '');
            $person = $row->user?->displayName() ?: (string) ($row->user?->username ?? '');
            $savedAt = optional($row->submitted_at)->format('Y-m-d H:i') ?? '';
            $source = $teamName !== '' ? 'Scouting team' : 'Attendant';
            foreach ($this->questionnaireProducts($payload) as $product) {
                $out[] = $this->questionnaireExcelRow(
                    $product,
                    (int) $row->competitor_ID,
                    $competitors,
                    $gamesCatalog,
                    $source,
                    $teamName !== '' ? $teamName : '—',
                    $person,
                    $savedAt
                );
            }
        }

        return $out;
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
        $competitors = $this->catalogCompetitorsQuery()->where('team_ID', $teamId)->get(['ID']);
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
    public function sendScoutReminders(bool $dryRun = false): array
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
            if ($dryRun) {
                $sent++;
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
        $qText = '';
        foreach ($person['questionnaires'] as $item) {
            $status = ! empty($item['started']) ? 'started, still incomplete' : 'not started';
            $qItems .= '<li><strong>'.e($item['name']).'</strong> — '.$status.'</li>';
            $qText .= '- '.$item['name'].' ('.$status.")\n";
        }
        $eval = $person['eval'];
        $evalLabel = (string) $eval['label'];
        $htmlQ = $qItems !== '' ? '<p><strong>Questionnaire missing</strong></p><ul>'.$qItems.'</ul>' : '';
        $htmlE = empty($eval['complete'])
            ? '<p><strong>Evaluation missing:</strong> '.e($evalLabel).'. Please fill all '.(int) $eval['required'].' rows.</p>'
            : '';
        $textQ = $qText !== '' ? "Questionnaire missing:\n{$qText}\n" : '';
        $textE = empty($eval['complete']) ? "Evaluation missing: {$evalLabel}. Please fill all {$eval['required']} rows.\n" : '';
        $email = (string) $person['email'];
        $subject = 'MERKURflow: '.$event.' scouting reminder';
        $safeFirst = e($first);
        $safeEvent = e($event);
        $safeEmail = e($email);
        $safeQUrl = e($qUrl);
        $safeEUrl = e($eUrl);
        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>{$safeEvent} reminder</title>
<style>
body { font: 14px 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 20px; color: #022052 }
a { color: #E83181 }
h1 { font-size: 28px; font-weight: bold; color: #E83181; margin-bottom: .25rem }
h1 em { font-weight: normal; color: #022052 }
p.lead { font-size: 16px; line-height: 22px }
hr { border: 2px solid #E83181 }
p.footer { font-size: 11px; line-height: 16px; color: #888 }
</style>
</head>
<body>
<h1>MERKUR<em>flow</em></h1>
<p class="lead">Hello {$safeFirst},<br>your <strong>{$safeEvent}</strong> scouting tasks are still open.</p>
{$htmlQ}
{$htmlE}
<p>
<a href="{$safeQUrl}">Open questionnaire</a>
&nbsp;·&nbsp;
<a href="{$safeEUrl}">Open evaluation</a>
</p>
<p>Please complete the missing items today. Your teammate can see the shared questionnaire once you start it.</p>
<p>Thank you.</p>
<hr>
<p class="footer">This reminder is sent to your company email {$safeEmail}. Log in to MERKURflow with that address.</p>
</body>
</html>
HTML;
        $plain = "Hello {$first},\n\nYour {$event} scouting tasks are still open.\n\n{$textQ}{$textE}"
            ."Please complete the missing items today. Your teammate can see the shared questionnaire once you start it.\n\n"
            ."Questionnaire: {$qUrl}\nEvaluation: {$eUrl}\n\nThank you.\n";

        Mail::send([], [], function ($message) use ($email, $subject, $html, $plain) {
            $message->to($email)
                ->subject($subject)
                ->html($html)
                ->text($plain);
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
        $competitorId = (string) ($row['competitor_ID'] ?? '') === '__new__' ? 0 : $this->competitorIdFromEvalRow($row, $competitors);
        $typedName = trim((string) ($row['competitor'] ?? ''));
        $catalogName = '';
        if ($competitorId > 0) {
            foreach ($competitors as $competitor) {
                if ((int) $competitor['ID'] === $competitorId) {
                    $catalogName = (string) $competitor['name'];
                    break;
                }
            }
        }
        $scores = ['graphic', 'sound', 'theme', 'mechanics', 'entertainment', 'innovation', 'potential', 'general'];
        $clean = [
            'competitor_ID' => $competitorId > 0 ? $competitorId : null,
            'competitor' => $catalogName !== '' ? $catalogName : $typedName,
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

        $count = $this->catalogCompetitorsQuery()
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
    private function catalogCompetitorsQuery()
    {
        return $this->applyCatalogCompetitorFilter($this->competitorsQuery());
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\Illuminate\Database\Eloquent\Model>  $query
     * @return \Illuminate\Database\Eloquent\Builder<\Illuminate\Database\Eloquent\Model>
     */
    private function applyCatalogCompetitorFilter($query)
    {
        $query->whereNotIn($query->getModel()->getTable() === 'ice2027_competitors' ? 'name' : 'ice2027_competitors.name', ['New product', '__open__']);
        if ($this->hasHiddenColumn()) {
            $column = $query->getModel()->getTable() === 'ice2027_competitors' ? 'hidden' : 'ice2027_competitors.hidden';
            $query->where(function ($inner) use ($column) {
                $inner->where($column, 0)->orWhereNull($column);
            });
        }

        return $query;
    }

    /**
     * @param  Ice2027Competitor  $competitor
     * @return array<string, mixed>
     */
    private function competitorArray(Ice2027Competitor $competitor): array
    {
        return [
            'ID' => (int) $competitor->ID,
            'name' => $competitor->name,
            'team_ID' => $competitor->team_ID === null ? null : (int) $competitor->team_ID,
            'team_name' => $competitor->team?->name,
            'game_count' => (int) ($competitor->games_count ?? $competitor->games()->count()),
            'hidden' => $this->hasHiddenColumn() ? (bool) $competitor->hidden : $this->isStorageCompetitorName((string) $competitor->name),
            'created_by' => $competitor->created_by === null ? null : (int) $competitor->created_by,
        ];
    }

    private function hasHiddenColumn(): bool
    {
        static $has = null;
        if ($has === null) {
            $has = Schema::hasColumn('ice2027_competitors', 'hidden');
        }

        return $has;
    }

    private function isStorageCompetitorName(string $name): bool
    {
        $normalized = strtolower(trim($name));

        return $normalized === 'new product' || $normalized === '__open__';
    }

    /**
     * @param  array<string, mixed>|null  $row
     */
    private function competitorRowIsStorage(?array $row): bool
    {
        return $row !== null && (
            ! empty($row['hidden']) || $this->isStorageCompetitorName((string) ($row['name'] ?? ''))
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function personalQuestionnairePayload(int $userId, int $competitorId): array
    {
        $row = Ice2027Questionnaire::query()
            ->where('user_ID', $userId)
            ->where('competitor_ID', $competitorId)
            ->first();

        return is_array($row?->payload) ? $row->payload : [];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function assertOpenQuestionnairePayload(array $payload): void
    {
        foreach ($this->questionnaireProducts($payload) as $product) {
            if (trim((string) ($product['competitor_name'] ?? $product['competitor'] ?? '')) === '') {
                throw new InvalidArgumentException('Select the competitor for each product.');
            }
            if (! empty($product['is_new_product'])) {
                if (trim((string) ($product['game_name'] ?? '')) === '') {
                    throw new InvalidArgumentException('Enter the game name for each new product.');
                }
                continue;
            }
            if ($this->productGameIds($product) === []) {
                throw new InvalidArgumentException('Select a game or turn on New product.');
            }
        }
        $this->assertCabinetProductPayload($payload);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function assertNewProductOnlyPayload(array $payload): void
    {
        foreach ($this->questionnaireProducts($payload) as $product) {
            if (empty($product['is_new_product'])) {
                throw new InvalidArgumentException('You can only add new products on this questionnaire.');
            }
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function assertCabinetProductPayload(array $payload): void
    {
        foreach ($this->questionnaireProducts($payload) as $product) {
            if ((string) ($product['category'] ?? '') !== 'cabinet') {
                continue;
            }
            if (trim((string) ($product['number_of_monitors'] ?? '')) === '') {
                throw new InvalidArgumentException('Enter the number of monitors for a cabinet.');
            }
            if (trim((string) ($product['monitor_size'] ?? '')) === '') {
                throw new InvalidArgumentException('Enter the monitor size for a cabinet.');
            }
            $uhd = strtolower(trim((string) ($product['uhd'] ?? '')));
            if (! in_array($uhd, ['yes', 'no'], true)) {
                throw new InvalidArgumentException('Select UHD yes or no for a cabinet.');
            }
            $vbp = strtolower(trim((string) ($product['video_button_panel'] ?? '')));
            if (! in_array($vbp, ['yes', 'no'], true)) {
                throw new InvalidArgumentException('Select Video Button Panel yes or no for a cabinet.');
            }
            if ($vbp === 'yes' && trim((string) ($product['vbp_functions'] ?? '')) === '') {
                throw new InvalidArgumentException('Enter the functions of the Video Button Panel.');
            }
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function assertUniqueCatalogGames(array $payload): void
    {
        $seenGames = [];
        foreach ($this->questionnaireProducts($payload) as $product) {
            if (! empty($product['is_new_product'])) {
                continue;
            }
            foreach (array_unique($this->productGameIds($product)) as $id) {
                if ($id < 1) {
                    continue;
                }
                if (isset($seenGames[$id])) {
                    throw new InvalidArgumentException('That game is already on this questionnaire. Pick a different game.');
                }
                $seenGames[$id] = true;
            }
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function applyProductCompetitorNames(array $payload, string $fallbackName = ''): array
    {
        $products = $this->questionnaireProducts($payload);
        foreach ($products as &$product) {
            $name = trim((string) ($product['competitor_name'] ?? ''));
            if ($name === '' && $fallbackName !== '') {
                $product['competitor_name'] = $fallbackName;
            }
        }
        unset($product);
        $payload['products'] = $products;

        return $payload;
    }

    /**
     * @param  array<string, mixed>|null  $competitor
     */
    private function isNewProductOnlyQuestionnaire(?array $competitor, bool $isScout): bool
    {
        if ($competitor && $this->competitorRowIsStorage($competitor)) {
            return false;
        }
        if (! $isScout) {
            return true;
        }
        if (! $competitor) {
            return false;
        }

        return (int) ($competitor['game_count'] ?? 0) === 0;
    }

    /**
     * @param  array<int|string, mixed>  $saved
     */
    private function evaluationSavedRowCount(array $saved): int
    {
        $highest = self::EVAL_REQUIRED_ROWS;
        $limit = self::EVAL_MAX_ROWS;
        if (array_is_list($saved)) {
            $count = count($saved);

            return min($limit, max($highest, $count));
        }
        for ($rank = 1; $rank <= $limit; $rank++) {
            $row = $saved[$rank] ?? $saved[(string) $rank] ?? null;
            if (is_array($row) && $this->evaluationRowState($row)['filled'] !== []) {
                $highest = $rank;
            }
        }

        return $highest;
    }

    /**
     * @return array{team_voters:int,team_pool:int,vote_pct:float,below_threshold:bool}
     */
    private function voteCoverage(int $teamVoters, int $teamPool): array
    {
        $pct = $teamPool > 0 ? ($teamVoters / $teamPool) * 100 : 0.0;

        return [
            'team_voters' => $teamVoters,
            'team_pool' => $teamPool,
            'vote_pct' => $pct,
            'below_threshold' => $teamPool < 1 || $pct < self::VOTE_THRESHOLD_PCT,
        ];
    }

    private function evaluationRankScore(float $average, float $votePct): float
    {
        return (($average / 5) * 100 + $votePct) / 2;
    }

    /**
     * @return array{ratings:int,rank1:int,rank_sum:int,play_yes:int,play_no:int,play_unsure:int,voters:array<int,bool>,score_sums:array<string,float>,total:float}
     */
    private function emptyEvalBucket(): array
    {
        return [
            'ratings' => 0,
            'rank1' => 0,
            'rank_sum' => 0,
            'play_yes' => 0,
            'play_no' => 0,
            'play_unsure' => 0,
            'voters' => [],
            'score_sums' => array_fill_keys(array_keys(self::EVAL_CRITERIA), 0.0),
            'total' => 0.0,
        ];
    }

    /**
     * @param  array{ratings:int,rank1:int,rank_sum:int|float,play_yes:int,play_no:int,play_unsure:int,voters:array,score_sums:array<string,float>,total:float}  $bucket
     * @return array{ratings:int,voters:int,rank1:int,avg_rank:float,average:float,averages:array<string,float>,play_yes:int,play_no:int,play_unsure:int,play_pct:float}
     */
    private function evalBucketStats(array $bucket): array
    {
        $count = (int) $bucket['ratings'];
        $averages = [];
        foreach ($bucket['score_sums'] as $field => $sum) {
            $averages[$field] = $count > 0 ? $sum / $count : 0.0;
        }

        return [
            'ratings' => $count,
            'voters' => count($bucket['voters']),
            'rank1' => (int) $bucket['rank1'],
            'avg_rank' => $count > 0 ? $bucket['rank_sum'] / $count : 0.0,
            'average' => $count > 0 ? $bucket['total'] / $count : 0.0,
            'averages' => $averages,
            'play_yes' => (int) $bucket['play_yes'],
            'play_no' => (int) $bucket['play_no'],
            'play_unsure' => (int) $bucket['play_unsure'],
            'play_pct' => $count > 0 ? ($bucket['play_yes'] / $count) * 100 : 0.0,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $competitors
     */
    private function matchesCompetitorFilter(array $resolved, int $bucketId, int $filterId, array $competitors): bool
    {
        if ($filterId < 1) {
            return true;
        }
        if (! isset($competitors[$filterId]) || $this->competitorRowIsStorage($competitors[$filterId])) {
            return false;
        }
        if ((int) ($resolved['competitor_ID'] ?? 0) === $filterId) {
            return true;
        }
        if ($bucketId === $filterId) {
            return true;
        }
        $want = strtolower(trim((string) ($competitors[$filterId]['name'] ?? '')));

        return $want !== '' && strtolower(trim((string) ($resolved['competitor'] ?? ''))) === $want;
    }

    /**
     * @param  array<int, array<string, mixed>>  $competitors
     */
    private function visibleCompetitorIdByName(array $competitors, string $name): int
    {
        $want = strtolower(trim($name));
        if ($want === '' || $this->isStorageCompetitorName($want)) {
            return 0;
        }
        foreach ($competitors as $id => $comp) {
            if ($this->competitorRowIsStorage($comp)) {
                continue;
            }
            if (strtolower(trim((string) ($comp['name'] ?? ''))) === $want) {
                return (int) $id;
            }
        }

        return 0;
    }

    private function dashboardGameLabel(string $gameName, string $gameType): string
    {
        $gameName = trim($gameName);
        if ($gameName !== '') {
            return $gameName;
        }
        if ($gameType === '' || $gameType === 'new_product') {
            return 'New product';
        }

        return self::GAME_TYPES[$gameType] ?? $gameType;
    }

    /**
     * @param  array{hidden?:mixed,name?:string}|null  $competitorRow
     */
    private function dashboardGameKey(
        int $gameId,
        int $competitorId,
        string $competitorName,
        string $gameName,
        string $gameType,
        ?array $competitorRow = null
    ): string {
        if ($gameId > 0) {
            return 'g:'.$gameId;
        }
        $compName = strtolower(trim($competitorName));
        $rowName = strtolower(trim((string) ($competitorRow['name'] ?? '')));
        $storage = $competitorRow !== null && (
            ! empty($competitorRow['hidden']) || $this->isStorageCompetitorName((string) ($competitorRow['name'] ?? ''))
        );
        if ($competitorRow === null && $competitorId > 0) {
            $storage = true;
        }
        if ($storage || $competitorId < 1) {
            if ($compName === '' || $this->isStorageCompetitorName($compName)) {
                $compName = ($rowName !== '' && ! $this->isStorageCompetitorName($rowName)) ? $rowName : 'unknown';
            }
            $idPart = $compName !== '' ? $compName : 'unknown';
        } else {
            $idPart = (string) $competitorId;
        }

        return 'n:'.$idPart.':'.strtolower($this->dashboardGameLabel($gameName, $gameType));
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
        $owner = $this->mediaOwnerForPhotoAccess($user, $competitorId);
        if ($owner !== null && preg_match('/^[1-9][0-9]*$/', $owner) === 1) {
            return (int) $owner;
        }

        return 0;
    }

    public function mediaOwnerForUser(int $userId): string
    {
        $team = $this->teamForUser($userId);

        return $team ? (string) (int) $team['ID'] : 'u'.$userId;
    }

    public function normalizeMediaOwner(string $owner): ?string
    {
        $owner = trim($owner);
        if (preg_match('/^[1-9][0-9]*$/', $owner) === 1 || preg_match('/^u[1-9][0-9]*$/', $owner) === 1) {
            return $owner;
        }

        return null;
    }

    public function mediaOwnerForPhotoAccess(User $user, int $competitorId, ?string $requested = null): ?string
    {
        $requested = $requested !== null ? $this->normalizeMediaOwner($requested) : null;
        if ($this->canManage($user)) {
            if ($requested !== null) {
                return $requested;
            }
            $competitor = Ice2027Competitor::query()->where('event_ID', $this->eventId())->find($competitorId);
            if ($competitor === null) {
                return null;
            }

            return (int) ($competitor->team_ID ?? 0) > 0
                ? (string) (int) $competitor->team_ID
                : ($competitor->created_by ? 'u'.(int) $competitor->created_by : null);
        }
        if (! $this->isAttendant($user) || $this->competitorAccessibleToUser((int) $user->ID, $competitorId) === null) {
            return null;
        }
        $owner = $this->mediaOwnerForUser((int) $user->ID);
        if ($requested !== null && $requested !== $owner) {
            return null;
        }

        return $owner;
    }

    public function productPhotoPath(int|string $owner, int $competitorId, string $fileId): ?string
    {
        if ($fileId === '' || str_contains($fileId, '/') || str_contains($fileId, '\\') || str_contains($fileId, '..')) {
            return null;
        }
        $owner = $this->normalizeMediaOwner((string) $owner);
        if ($owner === null || $competitorId < 1) {
            return null;
        }
        $path = rtrim((string) config('merkur.assets_path'), '/').'/scout/'.$this->eventId().'/'.$owner.'/'.$competitorId.'/'.$fileId;

        return is_file($path) ? $path : null;
    }

    /**
     * @return array{id:string,name:string,url:string,kind:string}
     */
    public function saveProductPhoto(User $user, int $competitorId, UploadedFile $file): array
    {
        if ($this->competitorAccessibleToUser((int) $user->ID, $competitorId) === null) {
            throw new InvalidArgumentException(
                $this->teamForUser((int) $user->ID)
                    ? 'That competitor is not assigned to your team.'
                    : 'Competitor not found.'
            );
        }
        $owner = $this->mediaOwnerForUser((int) $user->ID);
        if (! $file->isValid()) {
            throw new InvalidArgumentException('The file could not be uploaded.');
        }
        $mime = (string) $file->getMimeType();
        $ext = strtolower((string) pathinfo((string) $file->getClientOriginalName(), PATHINFO_EXTENSION));
        $isVideo = in_array($mime, ['video/mp4', 'video/quicktime', 'video/webm'], true) || in_array($ext, ['mp4', 'mov', 'm4v', 'webm'], true);
        $isImage = in_array($mime, ['image/jpeg', 'image/png'], true) || in_array($ext, ['jpg', 'jpeg', 'png'], true);
        if (! $isVideo && ! $isImage) {
            throw new InvalidArgumentException('Only JPG, PNG, and MP4 files are allowed.');
        }
        $maxBytes = $isVideo ? self::VIDEO_MAX_BYTES : self::PHOTO_MAX_BYTES;
        if ($file->getSize() < 1 || $file->getSize() > $maxBytes) {
            throw new InvalidArgumentException($isVideo ? 'Videos must be 150 MB or smaller.' : 'Pictures must be 10 MB or smaller.');
        }
        $original = basename((string) $file->getClientOriginalName() ?: ($isVideo ? 'video.mp4' : 'photo.jpg'));
        if ($isVideo) {
            $original = in_array($ext, ['mp4', 'mov', 'm4v', 'webm'], true) ? $original : 'video.mp4';
        } elseif (! in_array($ext, ['jpg', 'jpeg', 'png'], true)) {
            $original = 'photo.'.($mime === 'image/png' ? 'png' : 'jpg');
        }
        $dir = rtrim((string) config('merkur.assets_path'), '/').'/scout/'.$this->eventId().'/'.$owner.'/'.$competitorId.'/';
        if (! is_dir($dir) && ! @mkdir($dir, 0777, true) && ! is_dir($dir)) {
            throw new RuntimeException('Could not create the picture folder. Check that ASSETS_PATH is writable.');
        }
        $fileId = $user->ID.'~'.time().'~'.bin2hex(random_bytes(3)).'~~'.$original;
        $file->move($dir, $fileId);

        return [
            'id' => $fileId,
            'name' => $original,
            'url' => $this->photoApiPath($competitorId, $fileId, $owner),
            'kind' => $isVideo ? 'video' : 'image',
        ];
    }

    public function deleteProductPhoto(User $user, int $competitorId, string $fileId): void
    {
        if ($this->competitorAccessibleToUser((int) $user->ID, $competitorId) === null) {
            throw new InvalidArgumentException('That competitor is not assigned to your team.');
        }
        $owner = $this->mediaOwnerForUser((int) $user->ID);
        $path = $this->productPhotoPath($owner, $competitorId, $fileId);
        if ($path) {
            @unlink($path);
        }
    }

    private function photoApiPath(int $competitorId, string $fileId, ?string $owner = null): string
    {
        $url = '/ice2027/photo?e='.rawurlencode($this->event()->slug)
            .'&c='.$competitorId
            .'&f='.rawurlencode($fileId);
        $owner = $owner !== null ? $this->normalizeMediaOwner($owner) : null;
        if ($owner) {
            $url .= '&o='.rawurlencode($owner);
        }

        return $url;
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
            $out = array_merge($out, $this->photosFromProduct($product, $competitorId, (string) $teamId));
        }

        return $this->uniquePhotos($out);
    }

    /**
     * @param  array<string, mixed>  $product
     * @return list<array{id:string,name:string,url:string,kind:string}>
     */
    private function photosFromProduct(array $product, int $competitorId, int|string $owner): array
    {
        $out = [];
        $ownerKey = $this->normalizeMediaOwner((string) $owner) ?? (string) $owner;
        foreach ($product['photos'] ?? [] as $photo) {
            if (! is_array($photo) || empty($photo['id'])) {
                continue;
            }
            $fileId = (string) $photo['id'];
            $name = (string) ($photo['name'] ?? $fileId);
            $kind = (string) ($photo['kind'] ?? '');
            if ($kind !== 'video' && $kind !== 'image') {
                $kind = preg_match('/\.(mp4|mov|m4v|webm)($|\?)/i', $name.$fileId) ? 'video' : 'image';
            }
            $out[] = [
                'id' => $fileId,
                'name' => $name,
                'url' => $this->photoApiPath($competitorId, $fileId, $ownerKey),
                'kind' => $kind,
            ];
        }

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
        if ((string) ($row['game_ID'] ?? '') === '__new__') {
            $gameId = 0;
        }
        $competitorId = (int) ($row['competitor_ID'] ?? 0);
        if ((string) ($row['competitor_ID'] ?? '') === '__new__') {
            $competitorId = 0;
        }
        $gameType = $this->evaluationCategory($row);
        $gameName = trim((string) ($row['game_name'] ?? ''));
        $isNew = $this->evaluationIsNewProduct($row);
        $typedCompetitor = trim((string) ($row['competitor'] ?? $row['competitor_name'] ?? ''));

        if ($gameId > 0 && isset($games[$gameId])) {
            $game = $games[$gameId];
            $competitorId = (int) $game['competitor_ID'];
            $gameName = (string) $game['name'];
            if ($gameType === '') {
                $gameType = $this->evaluationCategory(['game_type' => (string) ($game['game_type'] ?? '')]);
            }
        }

        $competitorName = $typedCompetitor;
        $visibleRow = (
            $competitorId > 0
            && isset($competitors[$competitorId])
            && ! $this->competitorRowIsStorage($competitors[$competitorId])
        ) ? $competitors[$competitorId] : null;
        if ($visibleRow !== null) {
            $competitorName = (string) $visibleRow['name'];
        } else {
            $competitorId = 0;
            if ($competitorName === '' || $this->isStorageCompetitorName($competitorName)) {
                $competitorName = '';
            }
            $mapped = $this->visibleCompetitorIdByName(
                $competitors,
                $competitorName !== '' ? $competitorName : $typedCompetitor
            );
            if ($mapped > 0) {
                $competitorId = $mapped;
                $visibleRow = $competitors[$mapped];
                $competitorName = (string) $visibleRow['name'];
            }
        }

        $key = $this->dashboardGameKey($gameId, $competitorId, $competitorName, $gameName, $gameType, $visibleRow);

        return [
            'key' => $key,
            'game_ID' => $gameId,
            'game' => $this->dashboardGameLabel($gameName, $gameType),
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

    /**
     * @param  array<int, array<string, mixed>>  $competitors
     * @param  array<int, array<string, mixed>>  $gamesCatalog
     * @return list<mixed>
     */
    private function questionnaireExcelRow(
        array $product,
        int $competitorId,
        array $competitors,
        array $gamesCatalog,
        string $source,
        string $teamName,
        string $filledBy,
        string $savedAt
    ): array {
        $ids = $this->productGameIds($product);
        $gameId = $ids[0] ?? 0;
        $gameName = trim((string) ($product['game_name'] ?? ''));
        if ($gameName === '' && $gameId > 0 && isset($gamesCatalog[$gameId])) {
            $gameName = (string) $gamesCatalog[$gameId]['name'];
        }
        $competitorName = trim((string) ($product['competitor_name'] ?? $product['competitor'] ?? ''));
        if ($competitorName === '' && $competitorId > 0 && isset($competitors[$competitorId])) {
            $competitorName = (string) $competitors[$competitorId]['name'];
        }
        $category = (string) ($product['category'] ?? '');
        $mechanics = [];
        foreach ($product['functionality'] ?? [] as $key) {
            $mechanics[] = self::MECHANICS_OPTIONS[$key] ?? (string) $key;
        }
        $photos = $product['photos'] ?? [];
        $photoCount = is_array($photos) ? count($photos) : 0;

        return [
            $source,
            $teamName,
            $filledBy,
            $savedAt,
            $competitorName,
            $gameName !== '' ? $gameName : (self::GAME_TYPES[$category] ?? 'Product'),
            ! empty($product['is_new_product']) ? 'Yes' : 'No',
            self::GAME_TYPES[$category] ?? $category,
            $this->excelYesNo($product['progressive_jp'] ?? ''),
            $product['no_progressives'] ?? '',
            $product['no_static'] ?? '',
            $product['no_of_pots'] ?? '',
            implode(', ', $mechanics),
            (string) ($product['mechanics_description'] ?? ''),
            (string) ($product['win_lines'] ?? ''),
            (string) ($product['denomination'] ?? ''),
            (string) ($product['bets'] ?? ''),
            (string) ($product['theme'] ?? ''),
            (string) ($product['cabinet'] ?? ''),
            (string) ($product['target_market'] ?? ''),
            (string) ($product['usp'] ?? ''),
            $this->excelYesNo($product['integrated_jp'] ?? ''),
            $product['integrated_jp_number'] ?? '',
            $product['number_of_categories'] ?? '',
            $product['number_of_games'] ?? '',
            $product['number_of_monitors'] ?? '',
            (string) ($product['monitor_size'] ?? ''),
            $this->excelYesNo($product['uhd'] ?? ''),
            $this->excelYesNo($product['video_button_panel'] ?? ''),
            (string) ($product['vbp_functions'] ?? ''),
            $photoCount,
        ];
    }

    private function excelYesNo(mixed $value): string
    {
        $value = strtolower(trim((string) $value));
        if ($value === 'yes') {
            return 'Yes';
        }
        if ($value === 'no') {
            return 'No';
        }

        return '';
    }

    /**
     * @param  list<array{name:string,rows:list<list<mixed>>}>  $sheets
     */
    private function xlsxBinary(array $sheets): string
    {
        $sheetFiles = [];
        $sheetRels = [];
        $overrides = [
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
        ];
        foreach ($sheets as $i => $sheet) {
            $n = $i + 1;
            $xmlName = 'worksheets/sheet'.$n.'.xml';
            $sheetFiles[$xmlName] = $this->xlsxWorksheetXml($sheet['rows']);
            $sheetRels[] = '<Relationship Id="rId'.$n.'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="'.$xmlName.'"/>';
            $overrides[] = '<Override PartName="/xl/'.$xmlName.'" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
        }
        $workbookSheets = [];
        foreach ($sheets as $i => $sheet) {
            $n = $i + 1;
            $name = trim(str_replace(['\\', '/', '*', '?', ':', '[', ']'], ' ', (string) $sheet['name']));
            if ($name === '') {
                $name = 'Sheet'.$n;
            }
            $name = mb_substr($name, 0, 31);
            $workbookSheets[] = '<sheet name="'.$this->xlsxEscape($name).'" sheetId="'.$n.'" r:id="rId'.$n.'"/>';
        }
        $files = [
            '[Content_Types].xml' =>
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                .'<Default Extension="xml" ContentType="application/xml"/>'
                .implode('', $overrides)
                .'</Types>',
            '_rels/.rels' =>
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
                .'</Relationships>',
            'xl/workbook.xml' =>
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
                .' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
                .'<sheets>'.implode('', $workbookSheets).'</sheets></workbook>',
            'xl/_rels/workbook.xml.rels' =>
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                .implode('', $sheetRels)
                .'</Relationships>',
        ];
        foreach ($sheetFiles as $path => $xml) {
            $files['xl/'.$path] = $xml;
        }

        return $this->zipStoreBytes($files);
    }

    /**
     * @param  array<string, string>  $files
     */
    private function zipStoreBytes(array $files): string
    {
        $local = '';
        $central = '';
        $offset = 0;
        $count = 0;
        foreach ($files as $name => $content) {
            $name = str_replace('\\', '/', (string) $name);
            $content = (string) $content;
            $crc = crc32($content) & 0xFFFFFFFF;
            $size = strlen($content);
            $nameLen = strlen($name);
            $entry = pack('VvvvvvVVVvv', 0x04034b50, 20, 0, 0, 0, 0, $crc, $size, $size, $nameLen, 0)
                .$name
                .$content;
            $central .= pack('VvvvvvvVVVvvvvvVV', 0x02014b50, 20, 20, 0, 0, 0, 0, $crc, $size, $size, $nameLen, 0, 0, 0, 0, 0, $offset)
                .$name;
            $local .= $entry;
            $offset += strlen($entry);
            $count++;
        }

        return $local
            .$central
            .pack('VvvvvVVv', 0x06054b50, 0, 0, $count, $count, strlen($central), strlen($local), 0);
    }

    /**
     * @param  list<list<mixed>>  $rows
     */
    private function xlsxWorksheetXml(array $rows): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
        foreach ($rows as $r => $cells) {
            $rowNum = $r + 1;
            $xml .= '<row r="'.$rowNum.'">';
            foreach ($cells as $c => $value) {
                $col = $c + 1;
                $ref = $this->xlsxCol($col).$rowNum;
                if (is_int($value) || is_float($value)) {
                    $xml .= '<c r="'.$ref.'"><v>'.$value.'</v></c>';
                } else {
                    $text = trim((string) $value);
                    $xml .= $text === ''
                        ? '<c r="'.$ref.'"/>'
                        : '<c r="'.$ref.'" t="inlineStr"><is><t>'.$this->xlsxEscape($text).'</t></is></c>';
                }
            }
            $xml .= '</row>';
        }

        return $xml.'</sheetData></worksheet>';
    }

    private function xlsxCol(int $col): string
    {
        $name = '';
        while ($col > 0) {
            $col--;
            $name = chr(65 + ($col % 26)).$name;
            $col = intdiv($col, 26);
        }

        return $name;
    }

    private function xlsxEscape(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
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
