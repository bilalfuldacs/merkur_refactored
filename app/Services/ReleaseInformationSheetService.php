<?php

namespace App\Services;

use App\Models\Feature;
use App\Models\SoftwareRelease;
use App\Models\User;

class ReleaseInformationSheetService
{
    public function __construct(private ProductGamesListService $games) {}

    /**
     * @return array<string, mixed>
     */
    public function payload(int $releaseId, User $viewer): array
    {
        $release = SoftwareRelease::query()
            ->with(['build', 'releasedBy', 'baseDongle'])
            ->find($releaseId);

        if ($release === null) {
            abort(404, 'Unknown release.');
        }

        $build = $release->build;
        $versionId = $build?->version_ID;
        if ($versionId === null) {
            abort(404, 'Release has no build.');
        }

        $gamesPayload = $this->games->payload((int) $versionId);
        $alphabetical = [];
        foreach ($gamesPayload['sections'] as $section) {
            foreach ($section['games'] as $game) {
                if ($game['removed']) {
                    continue;
                }
                $alphabetical[] = [
                    'ID' => $game['ID'],
                    'name' => $game['name'],
                    'ID_text' => $game['ID_text'],
                    'studio' => $game['studio'],
                    'adopted' => $game['adopted'],
                    'gli11' => $game['gli11'],
                    'is_new' => (bool) $section['is_current'],
                ];
            }
        }
        usort($alphabetical, fn (array $a, array $b): int => strcasecmp((string) $a['name'], (string) $b['name']));

        $features = Feature::query()
            ->where('version_ID', $versionId)
            ->orderBy('name')
            ->get(['ID', 'name'])
            ->map(fn (Feature $feature) => [
                'ID' => $feature->ID,
                'name' => $feature->name,
            ])
            ->values()
            ->all();

        $dongle = $release->baseDongle;
        $dongleLabel = null;
        if ($dongle !== null) {
            $parts = array_filter([(string) $dongle->name, (string) $dongle->name2], fn (string $part) => $part !== '');
            $dongleLabel = $parts === [] ? null : implode(': ', $parts);
        }

        $releasedBy = $release->releasedBy;

        return [
            'ID' => $release->ID,
            'is_pre_release' => $release->release_date === null,
            'release_date' => $release->release_date?->format('Y-m-d'),
            'released_by' => $releasedBy instanceof User ? $releasedBy->displayName() : null,
            'GLI_approval_status' => $release->GLI_approval_status,
            'suitable_for_cabinets' => $release->suitable_for_cabinets,
            'suitable_for_markets' => $release->suitable_for_markets,
            'solved_issues' => $release->solved_issues,
            'notes' => $release->notes,
            'build' => [
                'ID' => $build?->ID,
                'name' => $build?->name,
                'p_label' => $build?->p_label,
                'checksum_system' => $build?->checksum_system,
                'checksum_verify' => $build?->checksum_verify,
                'checksum_app' => $build?->checksum_app,
                'version_ID' => $versionId,
            ],
            'dongle' => $dongleLabel,
            'features' => $features,
            'games' => [
                'total' => count($alphabetical),
                'new' => (int) ($gamesPayload['new_games'] ?? 0),
                'items' => $alphabetical,
            ],
            'generated_at' => now()->toRfc822String(),
            'generated_for' => $viewer->displayName(),
        ];
    }
}
