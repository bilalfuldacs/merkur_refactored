<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ice2027Competitor;
use App\Models\Ice2027Game;
use App\Models\Ice2027Team;
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
        abort_unless($request->user()->isSuperuser(), 403, 'Only administrators can manage ICE 2027.');

        return response()->json($this->ice->adminOverview());
    }

    public function setAttendant(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()->isSuperuser(), 403, 'Only administrators can manage ICE 2027.');

        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
        ]);

        try {
            $message = $this->ice->setAttendant((int) $user->ID, (bool) $data['enabled']);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => $message,
            ...$this->ice->adminOverview(),
        ]);
    }

    public function renameTeam(Request $request, Ice2027Team $team): JsonResponse
    {
        abort_unless($request->user()->isSuperuser(), 403, 'Only administrators can manage ICE 2027.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
        ]);

        try {
            $message = $this->ice->renameTeam((int) $team->ID, $data['name']);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => $message,
            ...$this->ice->adminOverview(),
        ]);
    }

    public function setMembers(Request $request, Ice2027Team $team): JsonResponse
    {
        abort_unless($request->user()->isSuperuser(), 403, 'Only administrators can manage ICE 2027.');

        $data = $request->validate([
            'member_1' => ['nullable', 'integer'],
            'member_2' => ['nullable', 'integer'],
        ]);

        try {
            $message = $this->ice->setTeamMembers((int) $team->ID, [
                (int) ($data['member_1'] ?? 0),
                (int) ($data['member_2'] ?? 0),
            ]);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => $message,
            ...$this->ice->adminOverview(),
        ]);
    }

    public function storeCompetitor(Request $request): JsonResponse
    {
        abort_unless($request->user()->isSuperuser(), 403, 'Only administrators can manage ICE 2027.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'team_ID' => ['nullable', 'integer'],
        ]);

        try {
            $message = $this->ice->addCompetitor(
                $data['name'],
                isset($data['team_ID']) ? (int) $data['team_ID'] : null,
                (int) $request->user()->ID,
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => $message,
            ...$this->ice->adminOverview(),
        ], 201);
    }

    public function updateCompetitor(Request $request, Ice2027Competitor $competitor): JsonResponse
    {
        abort_unless($request->user()->isSuperuser(), 403, 'Only administrators can manage ICE 2027.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'team_ID' => ['nullable', 'integer'],
        ]);

        try {
            $message = $this->ice->updateCompetitor(
                (int) $competitor->ID,
                $data['name'],
                array_key_exists('team_ID', $data) ? ($data['team_ID'] === null ? null : (int) $data['team_ID']) : null,
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => $message,
            ...$this->ice->adminOverview(),
        ]);
    }

    public function destroyCompetitor(Request $request, Ice2027Competitor $competitor): JsonResponse
    {
        abort_unless($request->user()->isSuperuser(), 403, 'Only administrators can manage ICE 2027.');

        $message = $this->ice->deleteCompetitor((int) $competitor->ID);

        return response()->json([
            'message' => $message,
            ...$this->ice->adminOverview(),
        ]);
    }

    public function storeGame(Request $request): JsonResponse
    {
        abort_unless($request->user()->isSuperuser(), 403, 'Only administrators can manage ICE 2027.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'competitor_ID' => ['required', 'integer'],
            'game_type' => ['nullable', 'string', 'max:32'],
        ]);

        try {
            $message = $this->ice->addGame(
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
            ...$this->ice->adminOverview(),
        ], 201);
    }

    public function updateGame(Request $request, Ice2027Game $game): JsonResponse
    {
        abort_unless($request->user()->isSuperuser(), 403, 'Only administrators can manage ICE 2027.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'competitor_ID' => ['required', 'integer'],
            'game_type' => ['nullable', 'string', 'max:32'],
        ]);

        try {
            $message = $this->ice->updateGame(
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
            ...$this->ice->adminOverview(),
        ]);
    }

    public function destroyGame(Request $request, Ice2027Game $game): JsonResponse
    {
        abort_unless($request->user()->isSuperuser(), 403, 'Only administrators can manage ICE 2027.');

        $message = $this->ice->deleteGame((int) $game->ID);

        return response()->json([
            'message' => $message,
            ...$this->ice->adminOverview(),
        ]);
    }
}
