<?php

namespace App\Services;

use App\Models\ScoutAttendant;
use App\Models\ScoutEvent;
use App\Models\User;
use InvalidArgumentException;

class ScoutEventService
{
    /**
     * @return list<array<string, mixed>>
     */
    public function menu(User $user): array
    {
        $isAdmin = $user->isSuperuser();
        $events = ScoutEvent::query()
            ->when(! $isAdmin, fn ($query) => $query->where('active', 1))
            ->orderBy('sort_order')
            ->orderByDesc('year')
            ->orderBy('name')
            ->get();

        $attendants = ScoutAttendant::query()
            ->where('user_ID', $user->ID)
            ->get()
            ->keyBy('event_ID');

        $visible = $events->filter(function (ScoutEvent $event) use ($isAdmin, $attendants) {
            if ($isAdmin) {
                return true;
            }

            return $attendants->has($event->ID);
        });

        return $visible->map(function (ScoutEvent $event) use ($isAdmin, $attendants) {
            $row = $attendants->get($event->ID);

            return [
                'ID' => (int) $event->ID,
                'slug' => $event->slug,
                'name' => $event->name,
                'year' => $event->year,
                'icon' => $event->icon,
                'active' => (bool) $event->active,
                'attendant' => $row !== null,
                'may_manage' => $isAdmin || (bool) ($row?->may_manage),
            ];
        })->values()->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function all(): array
    {
        return ScoutEvent::query()
            ->orderBy('sort_order')
            ->orderByDesc('year')
            ->orderBy('name')
            ->get()
            ->map(fn (ScoutEvent $event) => [
                'ID' => (int) $event->ID,
                'slug' => $event->slug,
                'name' => $event->name,
                'year' => $event->year,
                'icon' => $event->icon,
                'active' => (bool) $event->active,
                'sort_order' => (int) $event->sort_order,
            ])
            ->all();
    }

    public function create(string $name, string $slug, ?int $year, string $icon = 'fa-binoculars'): ScoutEvent
    {
        $name = trim($name);
        $slug = $this->normalizedSlug($slug !== '' ? $slug : $name);
        $icon = $this->normalizedIcon($icon);
        if ($name === '') {
            throw new InvalidArgumentException('Event name is required.');
        }
        if (ScoutEvent::query()->where('slug', $slug)->exists()) {
            throw new InvalidArgumentException('That event slug is already in use.');
        }

        $max = (int) ScoutEvent::query()->max('sort_order');

        return ScoutEvent::query()->create([
            'name' => $name,
            'slug' => $slug,
            'year' => $year,
            'icon' => $icon,
            'active' => true,
            'sort_order' => $max + 1,
            'created_at' => now(),
        ]);
    }

    public function update(ScoutEvent $event, string $name, ?int $year, string $icon, bool $active): ScoutEvent
    {
        $name = trim($name);
        if ($name === '') {
            throw new InvalidArgumentException('Event name is required.');
        }

        $event->fill([
            'name' => $name,
            'year' => $year,
            'icon' => $this->normalizedIcon($icon) ?: $event->icon,
            'active' => $active,
        ]);
        $event->save();

        return $event;
    }

    public function normalizedSlug(string $value): string
    {
        $slug = strtolower(trim($value));
        $slug = preg_replace('/[^a-z0-9]+/', '', $slug) ?? '';
        if (strlen($slug) < 2 || strlen($slug) > 32) {
            throw new InvalidArgumentException('Use a short slug like ice2028 or g2e2027.');
        }

        return $slug;
    }

    private function normalizedIcon(string $icon): string
    {
        $icon = preg_replace('/[^a-z0-9-]/', '', strtolower(trim($icon))) ?: 'fa-binoculars';

        return $icon;
    }
}
