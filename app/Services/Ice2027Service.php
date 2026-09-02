<?php

namespace App\Services;

use App\Models\Ice2027Competitor;
use App\Models\Ice2027Evaluation;
use App\Models\Ice2027Game;
use App\Models\Ice2027Questionnaire;
use App\Models\Ice2027Team;
use App\Models\Ice2027TeamMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class Ice2027Service
{
    public const MAX_TEAMS = 5;

    public const MEMBERS_PER_TEAM = 2;

    public const COMPETITORS_PER_TEAM = 3;

    public const GAME_TYPES = [
        'new_product' => 'New product',
        'mlp' => 'MLP',
        'sap' => 'SAP',
        'multigame' => 'Multigame',
        'cabinet' => 'Cabinet',
    ];

    public function seedTeamsIfEmpty(?int $createdBy = null): void
    {
        if (Ice2027Team::query()->exists()) {
            return;
        }

        foreach (['Team A', 'Team B', 'Team C', 'Team D', 'Team E'] as $name) {
            Ice2027Team::query()->create([
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
        $evalDone = $this->hasEvaluation($user->ID);
        $evalIds = $this->evaluatedCompetitorIds($user->ID);
        $questionnaires = Ice2027Questionnaire::query()
            ->where('user_ID', $user->ID)
            ->pluck('competitor_ID')
            ->map(fn ($id) => (int) $id)
            ->all();

        $competitors = array_map(function (array $competitor) use ($questionnaires, $evalIds) {
            $id = (int) $competitor['ID'];

            return [
                ...$competitor,
                'questionnaire_done' => in_array($id, $questionnaires, true),
                'evaluation_done' => in_array($id, $evalIds, true),
            ];
        }, $assigned);

        $doneCount = count(array_filter($competitors, fn (array $row) => $row['questionnaire_done']));

        return [
            'me' => [
                'attendant' => $user->isIceAttendant(),
                'admin' => $user->isSuperuser(),
                'scout' => $team !== null,
                'team' => $team,
                'evaluation_done' => $evalDone,
                'questionnaires_done' => $doneCount,
                'questionnaires_total' => count($competitors),
            ],
            'competitors' => $competitors,
            'all_competitors' => $this->competitors(),
            'game_types' => self::GAME_TYPES,
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
            ->get(['ID', 'firstname', 'lastname', 'username', 'iceattendent2027'])
            ->map(fn (User $person) => [
                'ID' => (int) $person->ID,
                'firstname' => $person->firstname,
                'lastname' => $person->lastname,
                'username' => $person->username,
                'name' => $person->displayName(),
                'iceattendent2027' => (bool) $person->iceattendent2027,
            ])
            ->values()
            ->all();
    }

    public function setAttendant(int $userId, bool $enabled): string
    {
        $user = User::query()->where('ID', $userId)->where('active', 1)->first();
        if ($user === null) {
            throw new InvalidArgumentException('That user was not found or is inactive.');
        }

        $user->iceattendent2027 = $enabled;
        $user->save();

        return $enabled ? 'ICE 2027 access enabled.' : 'ICE 2027 access removed.';
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function teams(): array
    {
        $teams = Ice2027Team::query()->orderBy('ID')->get(['ID', 'name']);
        $members = Ice2027TeamMember::query()
            ->with('user:ID,firstname,lastname,username')
            ->get();
        $competitors = Ice2027Competitor::query()->orderBy('name')->get(['ID', 'name', 'team_ID']);
        $games = Ice2027Game::query()
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
        ];
    }

    public function renameTeam(int $teamId, string $name): string
    {
        $name = trim($name);
        if ($name === '') {
            throw new InvalidArgumentException('Team name is required.');
        }

        $team = Ice2027Team::query()->find($teamId);
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
        $team = Ice2027Team::query()->find($teamId);
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
            if (! $exists->isIceAttendant()) {
                throw new InvalidArgumentException('That user is not marked as an ICE 2027 attendant.');
            }
            $elsewhere = Ice2027TeamMember::query()
                ->where('user_ID', $userId)
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
        return Ice2027Competitor::query()
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

        $current = Ice2027Competitor::query()->find($id);
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
        Ice2027Competitor::query()->where('ID', $id)->delete();

        return 'Competitor and their games were deleted.';
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function games(): array
    {
        return Ice2027Game::query()
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
        if (! Ice2027Competitor::query()->where('ID', $competitorId)->exists()) {
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
        if (! Ice2027Competitor::query()->where('ID', $competitorId)->exists()) {
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

        Ice2027Questionnaire::query()->updateOrCreate(
            ['user_ID' => $userId, 'competitor_ID' => $competitorId],
            ['payload' => $payload, 'submitted_at' => now()],
        );

        return 'Questionnaire saved.';
    }

    public function hasQuestionnaire(int $userId, int $competitorId): bool
    {
        return Ice2027Questionnaire::query()
            ->where('user_ID', $userId)
            ->where('competitor_ID', $competitorId)
            ->exists();
    }

    /**
     * @return array<string, mixed>
     */
    public function questionnairePayload(int $userId, int $competitorId): array
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
    public function saveEvaluation(int $userId, array $payload): string
    {
        Ice2027Evaluation::query()->updateOrCreate(
            ['user_ID' => $userId],
            ['payload' => $payload, 'submitted_at' => now()],
        );

        return 'Evaluation saved.';
    }

    public function hasEvaluation(int $userId): bool
    {
        return Ice2027Evaluation::query()->where('user_ID', $userId)->exists();
    }

    /**
     * @return array<string, mixed>
     */
    public function evaluationPayload(int $userId): array
    {
        $row = Ice2027Evaluation::query()->where('user_ID', $userId)->first();

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
            $row = $saved[$rank] ?? $saved[(string) $rank] ?? $saved[$rank - 1] ?? [];
            $rows[$rank] = is_array($row) ? $row : [];
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
        $top5 = [];
        foreach (array_values($rows) as $index => $row) {
            if (! is_array($row)) {
                continue;
            }
            $top5[(string) ($index + 1)] = $this->sanitizeEvalRow($row, $this->competitors());
        }

        return ['top5' => $top5];
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
        $scores = ['graphic', 'sound', 'theme', 'mechanics', 'entertainment', 'innovation', 'potential', 'general'];
        $clean = [
            'competitor_ID' => $this->competitorIdFromEvalRow($row, $competitors) ?: null,
            'game_type' => $this->optionalGameType((string) ($row['game_type'] ?? '')),
            'would_play' => in_array(($row['would_play'] ?? ''), ['yes', 'no', 'unsure'], true) ? $row['would_play'] : '',
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

        if (! Ice2027Team::query()->where('ID', $teamId)->exists()) {
            throw new InvalidArgumentException('Team not found.');
        }

        $count = Ice2027Competitor::query()
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
}
