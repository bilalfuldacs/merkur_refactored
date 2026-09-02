<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Ice2027Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class Ice2027Controller extends Controller
{
    public function __construct(private Ice2027Service $ice) {}

    public function bootstrap(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->canSeeIce2027(), 403, 'ICE 2027 is only available to attendants and administrators.');

        return response()->json($this->ice->bootstrap($user));
    }

    public function questionnaire(Request $request, int $competitor): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->isIceAttendant(), 403, 'ICE 2027 is only available to users marked as ICE 2027 attendants.');

        $assigned = $this->ice->competitorForUser((int) $user->ID, $competitor);
        if ($assigned === null) {
            return response()->json(['message' => 'That competitor is not assigned to you.'], 422);
        }

        return response()->json([
            'competitor' => $assigned,
            'products' => $this->ice->questionnairePayload((int) $user->ID, $competitor),
        ]);
    }

    public function saveQuestionnaire(Request $request, int $competitor): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->isIceAttendant(), 403, 'ICE 2027 is only available to users marked as ICE 2027 attendants.');

        $data = $request->validate([
            'products' => ['required', 'array'],
        ]);

        try {
            $message = $this->ice->saveQuestionnaire((int) $user->ID, $competitor, $data['products']);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => $message]);
    }

    public function evaluation(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->isIceAttendant(), 403, 'ICE 2027 is only available to users marked as ICE 2027 attendants.');

        $focusId = (int) $request->query('c', 0);
        $payload = $this->ice->evaluationPayload((int) $user->ID);
        $assigned = $this->ice->competitorsForUser((int) $user->ID);

        return response()->json([
            'scout' => $this->ice->isScout((int) $user->ID),
            'admin' => $user->isSuperuser(),
            'evaluation_done' => $this->ice->hasEvaluation((int) $user->ID),
            'assigned_ids' => array_map(fn (array $row) => (int) $row['ID'], $assigned),
            'competitors' => $this->ice->competitors(),
            'game_types' => Ice2027Service::GAME_TYPES,
            'top5' => $this->ice->normalizedTop5($payload, $focusId),
        ]);
    }

    public function saveEvaluation(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->isIceAttendant(), 403, 'ICE 2027 is only available to users marked as ICE 2027 attendants.');

        $data = $request->validate([
            'top5' => ['required', 'array', 'size:5'],
            'top5.*.competitor_ID' => ['nullable', 'integer'],
            'top5.*.game_type' => ['nullable', 'string', 'max:32'],
            'top5.*.graphic' => ['nullable', 'string', 'max:1'],
            'top5.*.sound' => ['nullable', 'string', 'max:1'],
            'top5.*.theme' => ['nullable', 'string', 'max:1'],
            'top5.*.mechanics' => ['nullable', 'string', 'max:1'],
            'top5.*.entertainment' => ['nullable', 'string', 'max:1'],
            'top5.*.innovation' => ['nullable', 'string', 'max:1'],
            'top5.*.potential' => ['nullable', 'string', 'max:1'],
            'top5.*.general' => ['nullable', 'string', 'max:1'],
            'top5.*.would_play' => ['nullable', 'string', 'max:16'],
        ]);

        $payload = $this->ice->evaluationPayloadFromRows($data['top5']);
        $message = $this->ice->saveEvaluation((int) $user->ID, $payload);

        return response()->json(['message' => $message]);
    }
}
