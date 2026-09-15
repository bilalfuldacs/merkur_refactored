<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScoutEvent;
use App\Services\ScoutEventService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class ScoutEventController extends Controller
{
    public function __construct(private ScoutEventService $events) {}

    public function menu(Request $request): JsonResponse
    {
        return response()->json([
            'events' => $this->events->menu($request->user()),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->isSuperuser(), 403, 'Only administrators can manage scouting events.');

        return response()->json([
            'events' => $this->events->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->isSuperuser(), 403, 'Only administrators can manage scouting events.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'slug' => ['nullable', 'string', 'max:32'],
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'icon' => ['nullable', 'string', 'max:40'],
        ]);

        try {
            $event = $this->events->create(
                $data['name'],
                (string) ($data['slug'] ?? ''),
                isset($data['year']) ? (int) $data['year'] : null,
                (string) ($data['icon'] ?? 'fa-binoculars'),
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Event created. You can now mark attendants and add teams.',
            'event' => $event,
            'events' => $this->events->all(),
        ], 201);
    }

    public function update(Request $request, ScoutEvent $event): JsonResponse
    {
        abort_unless($request->user()->isSuperuser(), 403, 'Only administrators can manage scouting events.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'icon' => ['nullable', 'string', 'max:40'],
            'active' => ['required', 'boolean'],
        ]);

        try {
            $this->events->update(
                $event,
                $data['name'],
                array_key_exists('year', $data) ? ($data['year'] === null ? null : (int) $data['year']) : $event->year,
                (string) ($data['icon'] ?? $event->icon),
                (bool) $data['active'],
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Event saved.',
            'events' => $this->events->all(),
        ]);
    }
}
