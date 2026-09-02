<?php

namespace App\Services;

use App\Models\Game;

class IssuesReportService
{
    public function __construct(private TableAttachmentsService $assets) {}

    /**
     * @return array<string, mixed>
     */
    public function payload(): array
    {
        $games = Game::query()
            ->with(['concept.studio', 'versionFrom', 'resolution'])
            ->orderBy('ID')
            ->get();

        $rows = [];
        $incomplete = 0;
        foreach ($games as $game) {
            $counts = $this->assets->classImageCounts('games', $game->ID, [
                'screenshots',
                'buttons-headers-banners',
            ]);
            $shots = min(3, (int) ($counts['screenshots'] ?? 0));
            $hasBanner = ((int) ($counts['buttons-headers-banners'] ?? 0)) > 0;
            $complete = $shots >= 3 && $hasBanner;
            if ($complete) {
                continue;
            }
            $incomplete++;
            $rows[] = [
                'ID' => $game->ID,
                'name' => $game->concept?->name ?: ('Game #'.$game->ID),
                'version' => $game->versionFrom?->name,
                'resolution' => $game->resolution?->name,
                'studio' => $game->concept?->studio?->name,
                'screenshot_1' => $shots >= 1,
                'screenshot_2' => $shots >= 2,
                'screenshot_3' => $shots >= 3,
                'banner' => $hasBanner,
            ];
        }

        return [
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'total' => $games->count(),
            'incomplete' => $incomplete,
            'games' => $rows,
        ];
    }
}
