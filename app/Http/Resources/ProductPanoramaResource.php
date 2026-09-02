<?php

namespace App\Http\Resources;

use App\Models\Availability;
use App\Models\Build;
use App\Models\Game;
use App\Models\GameReuse;
use App\Models\Jurisdiction;
use App\Models\VersionMilestone;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

class ProductPanoramaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $games = $this->panoramaGames();

        return [
            'ID' => $this->ID,
            'name' => $this->name,
            'name2' => $this->name2,
            'subtitle' => $this->subtitle,
            'description' => $this->description,
            'feat_in_products_pano' => (bool) $this->feat_in_products_pano,
            'sales_suspended' => (int) $this->status_ID === 650,
            'platform' => $this->whenLoaded('platform', fn () => $this->platform === null ? null : [
                'ID' => $this->platform->ID,
                'name' => $this->platform->name,
                'color' => $this->platform->color,
            ]),
            'status' => $this->whenLoaded('status', fn () => $this->status === null ? null : [
                'ID' => $this->status->ID,
                'name' => $this->status->name,
                'color' => $this->status->color,
                'text_color' => $this->status->text_color,
            ]),
            'markets' => [
                'available' => $this->marketsForStatus('availability'),
                'intended' => $this->marketsForStatus('intent'),
                'not_intended' => $this->marketsForStatus('no intent'),
            ],
            'compatibilities' => $this->panoramaCompatibilities(),
            'milestones' => $this->whenLoaded('milestones', fn () => $this->milestones->map(
                fn (VersionMilestone $milestone) => [
                    'ID' => $milestone->ID,
                    'expected_date' => $milestone->expected_date,
                    'actual_date' => $milestone->actual_date,
                    'jurisdiction' => $this->jurisdictionSummary($milestone->jurisdiction),
                    'expected_status' => $milestone->expectedStatus === null ? null : [
                        'ID' => $milestone->expectedStatus->ID,
                        'name' => $milestone->expectedStatus->name,
                        'color' => $milestone->expectedStatus->color,
                    ],
                ]
            )->values()),
            'games_count' => $games->count(),
            'games' => $games,
            'features_count' => $this->whenLoaded('features', fn () => $this->features->count()),
            'features' => $this->whenLoaded('features', fn () => $this->features->map(fn ($feature) => [
                'ID' => $feature->ID,
                'name' => $feature->name,
            ])->values()),
            'builds_count' => $this->whenLoaded('builds', fn () => $this->builds->count()),
            'releases_count' => $this->whenLoaded('builds', fn () => $this->builds
                ->filter(fn (Build $build) => $build->softwareRelease !== null)
                ->count()),
            'builds' => $this->whenLoaded('builds', fn () => $this->builds->map(fn (Build $build) => [
                'ID' => $build->ID,
                'name' => $build->name,
                'comment' => $build->comment,
                'jurisdiction' => $this->jurisdictionSummary($build->jurisdiction),
                'status' => $build->status === null ? null : [
                    'ID' => $build->status->ID,
                    'name' => $build->status->name,
                    'color' => $build->status->color,
                ],
                'release' => $build->softwareRelease === null ? null : [
                    'ID' => $build->softwareRelease->ID,
                    'release_date' => $build->softwareRelease->release_date,
                ],
                'milestones' => $build->milestones->map(fn ($milestone) => [
                    'ID' => $milestone->ID,
                    'expected_date' => $milestone->expected_date,
                    'actual_date' => $milestone->actual_date,
                    'expected_status' => $milestone->expectedStatus === null ? null : [
                        'ID' => $milestone->expectedStatus->ID,
                        'name' => $milestone->expectedStatus->name,
                        'color' => $milestone->expectedStatus->color,
                    ],
                ])->values(),
            ])->values()),
            'focus_groups_count' => $this->whenCounted('focusGroups'),
            'installations_count' => $this->whenCounted('installations'),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function marketsForStatus(string $status): array
    {
        if (! $this->relationLoaded('availabilities')) {
            return [];
        }

        return $this->availabilities
            ->where('status', $status)
            ->map(fn (Availability $availability) => [
                'ID' => $availability->ID,
                'priority' => $availability->priority,
                'jurisdiction' => $this->jurisdictionSummary($availability->jurisdiction),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function panoramaCompatibilities(): array
    {
        if (! $this->relationLoaded('compatibilities')) {
            return [];
        }

        $grouped = [];

        foreach ($this->compatibilities as $compatibility) {
            $type = $compatibility->component?->type;
            $typeName = $type?->name ?? 'Other';
            $grouped[$typeName] ??= [
                'type_ID' => $type?->ID,
                'type' => $typeName,
                'components' => [],
            ];
            $grouped[$typeName]['components'][] = [
                'compatibility_ID' => $compatibility->ID,
                'ID' => $compatibility->component?->ID,
                'name' => $compatibility->component?->name,
            ];
        }

        return array_values($grouped);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function panoramaGames(): Collection
    {
        $native = $this->relationLoaded('gamesFrom')
            ? $this->gamesFrom->map(fn (Game $game) => $this->gameSummary($game, false))
            : collect();

        $adopted = $this->relationLoaded('gameReusesFrom')
            ? $this->gameReusesFrom
                ->filter(fn (GameReuse $reuse) => $reuse->originalGame !== null)
                ->map(fn (GameReuse $reuse) => $this->gameSummary($reuse->originalGame, true, $reuse->ID))
            : collect();

        return $native->concat($adopted)
            ->sortBy(fn (array $game) => mb_strtolower((string) $game['name']), SORT_NATURAL)
            ->values();
    }

    /**
     * @return array<string, mixed>
     */
    private function gameSummary(Game $game, bool $adopted, ?int $reuseId = null): array
    {
        return [
            'ID' => $game->ID,
            'reuse_ID' => $reuseId,
            'adopted' => $adopted,
            'name' => $game->concept?->name,
            'ID_text' => $game->ID_text,
            'studio' => $game->concept?->studio === null ? null : [
                'ID' => $game->concept->studio->ID,
                'name' => $game->concept->studio->name,
            ],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function jurisdictionSummary(?Jurisdiction $jurisdiction): ?array
    {
        if ($jurisdiction === null) {
            return null;
        }

        return [
            'ID' => $jurisdiction->ID,
            'flag' => $jurisdiction->flag,
            'iso3166' => $jurisdiction->iso3166,
            'name_english' => $jurisdiction->name_english,
            'short_name_COMBINED' => $jurisdiction->short_name_COMBINED,
        ];
    }
}
