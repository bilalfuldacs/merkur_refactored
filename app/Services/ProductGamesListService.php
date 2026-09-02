<?php

namespace App\Services;

use App\Models\Defect;
use App\Models\Game;
use App\Models\GameReuse;
use App\Models\Version;

class ProductGamesListService
{
    /**
     * @return array<string, mixed>
     */
    public function payload(int $versionId): array
    {
        $version = Version::query()->find($versionId);
        if ($version === null) {
            abort(404, 'Unknown version.');
        }

        $chain = [];
        $walk = $version;
        $guard = 0;
        while ($walk instanceof Version && $guard < 30) {
            $chain[] = $walk;
            $walk = $walk->inherits_ID ? Version::query()->find($walk->inherits_ID) : null;
            $guard++;
        }

        $allGameIds = [];
        $sections = [];
        foreach ($chain as $index => $node) {
            $own = Game::query()
                ->with(['concept.studio', 'versionRemoved'])
                ->where('version_from_ID', $node->ID)
                ->get();
            $reuses = GameReuse::query()
                ->with(['originalGame.concept.studio', 'versionRemoved'])
                ->where('version_from_ID', $node->ID)
                ->get();

            $games = [];
            foreach ($own as $game) {
                $games[] = $this->gameRow($game, false, $chain);
            }
            foreach ($reuses as $reuse) {
                $original = $reuse->originalGame;
                if (! $original instanceof Game) {
                    continue;
                }
                $games[] = $this->gameRow($original, true, $chain, $reuse->versionRemoved);
            }

            usort($games, fn (array $a, array $b): int => strcasecmp((string) $a['name'], (string) $b['name']));

            foreach ($games as $game) {
                if (! $game['removed']) {
                    $allGameIds[] = $game['ID'];
                }
            }

            $sections[] = [
                'version_ID' => $node->ID,
                'name' => $node->name,
                'name2' => $node->name2,
                'description' => $node->description,
                'is_current' => $index === 0,
                'games' => $games,
            ];
        }

        $allGameIds = array_values(array_unique($allGameIds));
        $defects = Defect::query()
            ->with(['game.concept', 'version', 'build.version'])
            ->get()
            ->filter(function (Defect $defect) use ($allGameIds, $versionId) {
                if (! in_array((int) $defect->game_ID, $allGameIds, true)) {
                    return false;
                }
                if ($defect->version_ID === null && $defect->build_ID === null) {
                    return true;
                }
                if ((int) $defect->version_ID === $versionId) {
                    return true;
                }

                return $defect->build?->version_ID === $versionId;
            })
            ->map(function (Defect $defect) {
                $scope = 'Global';
                if ($defect->build_ID) {
                    $scope = 'Build '.($defect->build?->name ?: '#'.$defect->build_ID);
                } elseif ($defect->version_ID) {
                    $scope = 'Version '.($defect->version?->name ?: '#'.$defect->version_ID);
                }

                return [
                    'ID' => $defect->ID,
                    'name' => $defect->name,
                    'scope' => $scope,
                    'game_ID' => $defect->game_ID,
                    'game_name' => $defect->game?->concept?->name,
                ];
            })
            ->values();

        $currentGames = $sections[0]['games'] ?? [];
        $newCount = count(array_filter($currentGames, fn (array $game): bool => ! $game['removed']));

        return [
            'version' => [
                'ID' => $version->ID,
                'name' => $version->name,
                'name2' => $version->name2,
            ],
            'inheritance' => array_map(fn (Version $node) => [
                'ID' => $node->ID,
                'name' => $node->name,
            ], $chain),
            'new_games' => $newCount,
            'total_games' => count($allGameIds),
            'sections' => $sections,
            'defects' => $defects,
        ];
    }

    /**
     * @param  list<Version>  $chain
     * @return array<string, mixed>
     */
    private function gameRow(Game $game, bool $adopted, array $chain, mixed $removedByReuse = null): array
    {
        $removedVersion = $removedByReuse ?? $game->versionRemoved;
        $removed = false;
        $removedName = null;
        if ($removedVersion !== null) {
            $chainIds = array_map(fn (Version $node) => $node->ID, $chain);
            if (in_array($removedVersion->ID, $chainIds, true)) {
                $removed = true;
                $removedName = $removedVersion->name;
            }
        }

        return [
            'ID' => $game->ID,
            'name' => $game->concept?->name ?: ('Game #'.$game->ID),
            'ID_text' => $game->ID_text,
            'studio' => $game->concept?->studio?->name,
            'adopted' => $adopted,
            'gli11' => (bool) $game->gli11,
            'removed' => $removed,
            'removed_in' => $removedName,
        ];
    }
}
