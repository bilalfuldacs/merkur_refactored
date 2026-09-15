<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ice2027Competitor;
use App\Models\Ice2027Game;
use App\Models\Ice2027Team;
use App\Models\ScoutEvent;
use App\Models\User;
use App\Services\Ice2027Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class Ice2027AdminController extends Controller
{
    public function __construct(private Ice2027Service $ice) {}

    public function show(Request $request): JsonResponse
    {
        $ice = $this->iceFor($request);
        abort_unless($ice->canManage($request->user()), 403, 'Only administrators can manage this scouting event.');

        return response()->json($ice->adminOverview());
    }

    public function setAttendant(Request $request, User $user): JsonResponse
    {
        $ice = $this->iceFor($request);
        abort_unless($ice->canManage($request->user()), 403, 'Only administrators can manage this scouting event.');

        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'may_manage' => ['sometimes', 'boolean'],
        ]);

        try {
            $message = $ice->setAttendant((int) $user->ID, (bool) $data['enabled'], $data['may_manage'] ?? null);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => $message,
            ...$ice->adminOverview(),
        ]);
    }

    public function saveAttendants(Request $request): JsonResponse
    {
        $ice = $this->iceFor($request);
        abort_unless($ice->canManage($request->user()), 403, 'Only administrators can manage this scouting event.');

        $data = $request->validate([
            'attendant' => ['present', 'array'],
            'attendant.*' => ['integer'],
            'manage' => ['present', 'array'],
            'manage.*' => ['integer'],
        ]);

        try {
            $message = $ice->saveAttendants($data['attendant'], $data['manage']);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => $message,
            ...$ice->adminOverview(),
        ]);
    }

    public function renameTeam(Request $request, Ice2027Team $team): JsonResponse
    {
        $ice = $this->iceFor($request);
        abort_unless($ice->canManage($request->user()), 403, 'Only administrators can manage this scouting event.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
        ]);

        try {
            $message = $ice->renameTeam((int) $team->ID, $data['name']);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => $message,
            ...$ice->adminOverview(),
        ]);
    }

    public function setMembers(Request $request, Ice2027Team $team): JsonResponse
    {
        $ice = $this->iceFor($request);
        abort_unless($ice->canManage($request->user()), 403, 'Only administrators can manage this scouting event.');

        $data = $request->validate([
            'member_1' => ['nullable', 'integer'],
            'member_2' => ['nullable', 'integer'],
        ]);

        try {
            $message = $ice->setTeamMembers((int) $team->ID, [
                (int) ($data['member_1'] ?? 0),
                (int) ($data['member_2'] ?? 0),
            ]);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => $message,
            ...$ice->adminOverview(),
        ]);
    }

    public function storeCompetitor(Request $request): JsonResponse
    {
        $ice = $this->iceFor($request);
        abort_unless($ice->canManage($request->user()), 403, 'Only administrators can manage this scouting event.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'team_ID' => ['nullable', 'integer'],
        ]);

        try {
            $message = $ice->addCompetitor(
                $data['name'],
                isset($data['team_ID']) ? (int) $data['team_ID'] : null,
                (int) $request->user()->ID,
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => $message,
            ...$ice->adminOverview(),
        ], 201);
    }

    public function updateCompetitor(Request $request, Ice2027Competitor $competitor): JsonResponse
    {
        $ice = $this->iceFor($request);
        abort_unless($ice->canManage($request->user()), 403, 'Only administrators can manage this scouting event.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'team_ID' => ['nullable', 'integer'],
        ]);

        try {
            $message = $ice->updateCompetitor(
                (int) $competitor->ID,
                $data['name'],
                array_key_exists('team_ID', $data) ? ($data['team_ID'] === null ? null : (int) $data['team_ID']) : null,
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => $message,
            ...$ice->adminOverview(),
        ]);
    }

    public function destroyCompetitor(Request $request, Ice2027Competitor $competitor): JsonResponse
    {
        $ice = $this->iceFor($request);
        abort_unless($ice->canManage($request->user()), 403, 'Only administrators can manage this scouting event.');

        $message = $ice->deleteCompetitor((int) $competitor->ID);

        return response()->json([
            'message' => $message,
            ...$ice->adminOverview(),
        ]);
    }

    public function storeGame(Request $request): JsonResponse
    {
        $ice = $this->iceFor($request);
        abort_unless($ice->canManage($request->user()), 403, 'Only administrators can manage this scouting event.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'competitor_ID' => ['required', 'integer'],
            'game_type' => ['nullable', 'string', 'max:32'],
        ]);

        try {
            $message = $ice->addGame(
                (int) $data['competitor_ID'],
                $data['name'],
                (string) ($data['game_type'] ?? ''),
                (int) $request->user()->ID,
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => $message,
            ...$ice->adminOverview(),
        ], 201);
    }

    public function updateGame(Request $request, Ice2027Game $game): JsonResponse
    {
        $ice = $this->iceFor($request);
        abort_unless($ice->canManage($request->user()), 403, 'Only administrators can manage this scouting event.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'competitor_ID' => ['required', 'integer'],
            'game_type' => ['nullable', 'string', 'max:32'],
        ]);

        try {
            $message = $ice->updateGame(
                (int) $game->ID,
                (int) $data['competitor_ID'],
                $data['name'],
                (string) ($data['game_type'] ?? ''),
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => $message,
            ...$ice->adminOverview(),
        ]);
    }

    public function destroyGame(Request $request, Ice2027Game $game): JsonResponse
    {
        $ice = $this->iceFor($request);
        abort_unless($ice->canManage($request->user()), 403, 'Only administrators can manage this scouting event.');

        $message = $ice->deleteGame((int) $game->ID);

        return response()->json([
            'message' => $message,
            ...$ice->adminOverview(),
        ]);
    }

    public function sendReminders(Request $request): JsonResponse
    {
        $ice = $this->iceFor($request);
        abort_unless($ice->canManage($request->user()), 403, 'Only administrators can manage this scouting event.');

        $result = $ice->sendScoutReminders();
        $failed = $result['failed'] === [] ? '' : ' Failed: '.implode(', ', $result['failed']).'.';
        $message = 'Sent '.$result['sent'].' of '.$result['recipients'].' reminder'.($result['recipients'] === 1 ? '' : 's').'.'.$failed;

        return response()->json([
            'message' => $message,
            ...$ice->adminOverview(),
        ]);
    }

    private function iceFor(Request $request): Ice2027Service
    {
        $slug = (string) $request->query('e', $request->input('e', ''));
        $event = $slug !== '' ? ScoutEvent::fromSlug($slug) : ScoutEvent::default();
        abort_unless($event !== null, 404, 'Unknown scouting event.');

        return $this->ice->forEvent((int) $event->ID);
    }
}
