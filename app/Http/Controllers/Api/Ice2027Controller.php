<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScoutEvent;
use App\Services\Ice2027Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use InvalidArgumentException;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class Ice2027Controller extends Controller
{
    public function __construct(private Ice2027Service $ice) {}

    public function bootstrap(Request $request): JsonResponse
    {
        $ice = $this->iceFor($request);
        $user = $request->user();
        abort_unless($ice->canSee($user), 403, 'This scouting event is only available to attendants and administrators.');

        return response()->json($ice->bootstrap($user));
    }

    public function questionnaire(Request $request, int $competitor): JsonResponse
    {
        $ice = $this->iceFor($request);
        $user = $request->user();
        abort_unless($ice->isAttendant($user), 403, 'This scouting event is only available to attendants.');

        try {
            return response()->json($ice->questionnaireView($user, $competitor));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function saveQuestionnaire(Request $request, int $competitor): JsonResponse
    {
        $ice = $this->iceFor($request);
        $user = $request->user();
        abort_unless($ice->isAttendant($user), 403, 'This scouting event is only available to attendants.');

        $data = $request->validate([
            'products' => ['present', 'array'],
        ]);

        try {
            $message = $ice->saveQuestionnaire((int) $user->ID, $competitor, $data['products']);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => $message,
            ...$ice->questionnaireView($user, $competitor),
        ]);
    }

    public function evaluation(Request $request): JsonResponse
    {
        $ice = $this->iceFor($request);
        $user = $request->user();
        abort_unless($ice->isAttendant($user), 403, 'This scouting event is only available to attendants.');

        $focusId = (int) $request->query('c', 0);
        $payload = $ice->evaluationPayload((int) $user->ID);
        $assigned = $ice->competitorsForUser((int) $user->ID);
        $top5 = $ice->normalizedTop5($payload, $focusId);
        $progress = $ice->evaluationStatusFromRows($ice->completeEvaluationRowCount(['top5' => $top5]));

        return response()->json([
            'scout' => $ice->isScout((int) $user->ID),
            'admin' => $ice->canManage($user),
            'evaluation_done' => $progress['complete'],
            'progress' => $progress,
            'assigned_ids' => array_map(fn (array $row) => (int) $row['ID'], $assigned),
            'competitors' => $ice->competitors(),
            'games' => $ice->games(),
            'game_types' => Ice2027Service::GAME_TYPES,
            'eval_categories' => Ice2027Service::EVAL_CATEGORIES,
            'top5' => $top5,
            'event' => [
                'ID' => $ice->eventId(),
                'slug' => $ice->event()->slug,
                'name' => $ice->event()->name,
            ],
        ]);
    }

    public function saveEvaluation(Request $request): JsonResponse
    {
        $ice = $this->iceFor($request);
        $user = $request->user();
        abort_unless($ice->isAttendant($user), 403, 'This scouting event is only available to attendants.');

        $data = $request->validate([
            'top5' => ['required', 'array', 'size:5'],
            'top5.*.competitor_ID' => ['nullable', 'integer'],
            'top5.*.game_ID' => ['nullable'],
            'top5.*.game_name' => ['nullable', 'string', 'max:255'],
            'top5.*.is_new_product' => ['nullable'],
            'top5.*.game_type' => ['nullable', 'string', 'max:32'],
            'top5.*.note' => ['nullable', 'string', 'max:500'],
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

        try {
            $payload = $ice->evaluationPayloadFromRows($data['top5']);
            $message = $ice->saveEvaluation((int) $user->ID, $payload);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => $message]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $ice = $this->iceFor($request);
        abort_unless($ice->canManage($request->user()), 403, 'Only administrators can view this scouting dashboard.');

        return response()->json($ice->evaluationDashboard([
            'team_ID' => (int) $request->query('team', 0),
            'competitor_ID' => (int) $request->query('competitor', 0),
            'game_type' => (string) $request->query('type', ''),
            'would_play' => (string) $request->query('play', ''),
        ]));
    }

    public function progress(Request $request): JsonResponse
    {
        $ice = $this->iceFor($request);
        abort_unless($ice->canManage($request->user()), 403, 'Only administrators can view scouting progress.');

        return response()->json($ice->progressDashboard());
    }

    public function photo(Request $request): BinaryFileResponse
    {
        $ice = $this->iceFor($request);
        abort_unless($ice->canSee($request->user()), 403, 'This scouting event is only available to attendants and administrators.');

        $competitorId = (int) $request->query('c', 0);
        $fileId = (string) $request->query('f', '');
        $teamId = $ice->teamIdForPhoto($request->user(), $competitorId);
        abort_unless($teamId > 0 && $fileId !== '', 404, 'Picture not found.');

        $path = $ice->productPhotoPath($teamId, $competitorId, $fileId);
        abort_unless($path !== null, 404, 'Picture not found.');

        return response()->file($path);
    }

    public function uploadPhoto(Request $request): JsonResponse
    {
        $ice = $this->iceFor($request);
        $user = $request->user();
        abort_unless($ice->isAttendant($user), 403, 'This scouting event is only available to attendants.');

        $data = $request->validate([
            'competitor_ID' => ['required', 'integer'],
            'photo' => ['required', 'file', 'max:10240'],
        ]);

        $file = $request->file('photo');
        if (! $file instanceof UploadedFile) {
            return response()->json(['message' => 'Choose a picture to upload.'], 422);
        }

        try {
            $photo = $ice->saveProductPhoto($user, (int) $data['competitor_ID'], $file);
        } catch (InvalidArgumentException | RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['ok' => true, 'photo' => $photo]);
    }

    public function deletePhoto(Request $request): JsonResponse
    {
        $ice = $this->iceFor($request);
        $user = $request->user();
        abort_unless($ice->isAttendant($user), 403, 'This scouting event is only available to attendants.');

        $data = $request->validate([
            'competitor_ID' => ['required', 'integer'],
            'f' => ['required', 'string'],
        ]);

        try {
            $ice->deleteProductPhoto($user, (int) $data['competitor_ID'], $data['f']);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['ok' => true]);
    }

    private function iceFor(Request $request): Ice2027Service
    {
        $slug = (string) $request->query('e', $request->input('e', ''));
        $event = $slug !== '' ? ScoutEvent::fromSlug($slug) : ScoutEvent::default();
        abort_unless($event !== null, 404, 'Unknown scouting event.');

        return $this->ice->forEvent((int) $event->ID);
    }
}
