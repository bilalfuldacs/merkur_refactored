<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\FieldTrialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class FieldTrialController extends Controller
{
    public function tree(Request $request, FieldTrialService $trials): JsonResponse
    {
        return $this->run(function () use ($request, $trials) {
            $from = $request->query('from');
            $until = $request->query('to');

            return $trials->tree(
                $this->user($request),
                is_string($from) ? $from : null,
                is_string($until) ? $until : null,
            );
        });
    }

    public function market(Request $request, FieldTrialService $trials): JsonResponse
    {
        return $this->run(function () use ($request, $trials) {
            $id = (int) $request->query('jurisdiction_id');

            return [
                'jurisdiction_id' => $id,
                'partners' => $trials->marketTree($this->user($request), $id),
            ];
        });
    }

    public function options(Request $request, FieldTrialService $trials): JsonResponse
    {
        return $this->run(function () use ($request, $trials) {
            $partner = $request->query('partner_id');

            return $trials->options(
                $this->user($request),
                (int) $request->query('jurisdiction_id'),
                is_string($partner) && $partner !== '' ? (int) $partner : null,
            );
        });
    }

    public function saveGame(Request $request, FieldTrialService $trials): JsonResponse
    {
        return $this->run(fn () => [
            'game' => $trials->saveGame($this->user($request), $request->all()),
        ]);
    }

    public function deleteGame(Request $request, FieldTrialService $trials, int $id): JsonResponse
    {
        return $this->run(function () use ($request, $trials, $id) {
            $trials->deleteGame($this->user($request), $id);

            return ['ok' => true];
        });
    }

    public function saveVenue(Request $request, FieldTrialService $trials): JsonResponse
    {
        return $this->run(fn () => [
            'venue' => $trials->saveVenue($this->user($request), $request->all()),
        ]);
    }

    public function savePartner(Request $request, FieldTrialService $trials): JsonResponse
    {
        return $this->run(fn () => [
            'partner' => $trials->savePartner($this->user($request), $request->all()),
        ]);
    }

    public function history(Request $request, FieldTrialService $trials, int $id): JsonResponse
    {
        return $this->run(fn () => [
            'revisions' => $trials->history($this->user($request), $id),
        ]);
    }

    public function media(Request $request, FieldTrialService $trials, int $id): JsonResponse
    {
        return $this->run(fn () => [
            'media' => $trials->listMedia($this->user($request), $id),
        ]);
    }

    public function uploadMedia(Request $request, FieldTrialService $trials, int $id): JsonResponse
    {
        return $this->run(function () use ($request, $trials, $id) {
            $file = $request->file('file');
            if ($file === null) {
                throw new InvalidArgumentException('Choose a picture or video to upload.');
            }

            return [
                'item' => $trials->saveMedia($this->user($request), $id, $file),
            ];
        });
    }

    public function deleteMedia(Request $request, FieldTrialService $trials, int $id): JsonResponse
    {
        return $this->run(function () use ($request, $trials, $id) {
            $trials->deleteMedia($this->user($request), $id, (string) $request->input('file', ''));

            return ['ok' => true];
        });
    }

    public function mediaFile(Request $request, FieldTrialService $trials, int $id, string $file = ''): BinaryFileResponse|JsonResponse
    {
        try {
            $named = $request->query('f');
            if (is_string($named) && $named !== '') {
                $file = $named;
            }
            $path = $trials->mediaPathFor($this->user($request), $id, $file);

            return response()->file($path);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    private function user(Request $request): User
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('role');

        return $user;
    }

    /**
     * @param  callable(): array<string, mixed>  $callback
     */
    private function run(callable $callback): JsonResponse
    {
        try {
            return response()->json($callback());
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
