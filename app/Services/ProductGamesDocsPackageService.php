<?php

namespace App\Services;

use App\Models\Game;
use App\Models\GameReuse;
use App\Models\User;
use App\Models\Version;
use InvalidArgumentException;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;

class ProductGamesDocsPackageService
{
    public function __construct(private TableAttachmentsService $attachments) {}

    /**
     * @return array<string, mixed>
     */
    public function payload(int $versionId, User $user): array
    {
        $version = Version::query()->find($versionId);
        if ($version === null) {
            abort(404, 'Unknown version.');
        }

        $user->loadMissing('role');
        $games = $this->gamesForVersion($versionId);
        $items = [];
        foreach ($games as $game) {
            $files = $this->attachments->listFlatGameDocs((int) $game['ID'], $user);
            $items[] = [
                'ID' => $game['ID'],
                'name' => $game['name'],
                'files' => $files,
            ];
        }

        return [
            'version' => [
                'ID' => $version->ID,
                'name' => $version->name,
                'name2' => $version->name2,
            ],
            'games' => $items,
            'file_count' => array_sum(array_map(fn (array $item): int => count($item['files']), $items)),
        ];
    }

    /**
     * @param  list<array{game_ID: int, tlp: string, filename: string}>  $selection
     */
    public function downloadZip(int $versionId, User $user, array $selection): StreamedResponse
    {
        $version = Version::query()->find($versionId);
        if ($version === null) {
            abort(404, 'Unknown version.');
        }

        $user->loadMissing('role');
        $allowedGames = [];
        foreach ($this->gamesForVersion($versionId) as $game) {
            $allowedGames[(int) $game['ID']] = (string) $game['name'];
        }

        if ($selection === []) {
            throw new InvalidArgumentException('Select at least one file.');
        }

        $entries = [];
        $usedNames = [];
        foreach ($selection as $index => $row) {
            $gameId = (int) ($row['game_ID'] ?? 0);
            $tlp = (string) ($row['tlp'] ?? '');
            $filename = (string) ($row['filename'] ?? '');
            if ($gameId <= 0 || ! isset($allowedGames[$gameId])) {
                throw new InvalidArgumentException('Unknown game in selection.');
            }
            if (! in_array($tlp, ['amber', 'green', 'clear'], true)) {
                throw new InvalidArgumentException('Unknown asset.');
            }

            $path = $this->attachments->resolveFlatGameDocPath($gameId, $tlp, $filename);
            $niceName = $this->displayNameFromFilename(basename($path));
            $gameFolder = $this->safeZipSegment($allowedGames[$gameId] !== '' ? $allowedGames[$gameId] : 'Game-'.$gameId);
            $zipPath = $gameFolder.'/'.$tlp.'/'.$this->safeZipSegment($niceName);
            if (isset($usedNames[$zipPath])) {
                $zipPath = $gameFolder.'/'.$tlp.'/'.$this->safeZipSegment($index.'-'.$niceName);
            }
            $usedNames[$zipPath] = true;
            $entries[] = ['path' => $path, 'zip' => $zipPath];
        }

        $tmp = tempnam(sys_get_temp_dir(), 'docs-pkg-');
        if ($tmp === false) {
            throw new RuntimeException('Could not create temporary ZIP.');
        }
        $zipPath = $tmp.'.zip';
        @unlink($tmp);

        $zip = new ZipArchive;
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('Could not create ZIP archive.');
        }
        foreach ($entries as $entry) {
            $zip->addFile($entry['path'], $entry['zip']);
        }
        $zip->close();

        $downloadName = 'docs-package-v'.$versionId.'.zip';

        return response()->streamDownload(function () use ($zipPath): void {
            $handle = fopen($zipPath, 'rb');
            if ($handle === false) {
                return;
            }
            fpassthru($handle);
            fclose($handle);
            @unlink($zipPath);
        }, $downloadName, [
            'Content-Type' => 'application/zip',
        ]);
    }

    /**
     * @return list<array{ID: int, name: string}>
     */
    private function gamesForVersion(int $versionId): array
    {
        $own = Game::query()
            ->with('concept')
            ->where('version_from_ID', $versionId)
            ->get();
        $reuses = GameReuse::query()
            ->with('originalGame.concept')
            ->where('version_from_ID', $versionId)
            ->get();

        $games = [];
        $seen = [];
        foreach ($own as $game) {
            $seen[$game->ID] = true;
            $games[] = [
                'ID' => $game->ID,
                'name' => $game->concept?->name ?: ('Game #'.$game->ID),
            ];
        }
        foreach ($reuses as $reuse) {
            $original = $reuse->originalGame;
            if (! $original instanceof Game || isset($seen[$original->ID])) {
                continue;
            }
            $seen[$original->ID] = true;
            $games[] = [
                'ID' => $original->ID,
                'name' => $original->concept?->name ?: ('Game #'.$original->ID),
            ];
        }

        usort($games, fn (array $a, array $b): int => strcasecmp((string) $a['name'], (string) $b['name']));

        return $games;
    }

    private function displayNameFromFilename(string $rawName): string
    {
        if (preg_match('/^(.+)~(.+)~(.*)~(.*)$/', $rawName, $matches) === 1) {
            return $matches[4] !== '' ? $matches[4] : $rawName;
        }

        return $rawName;
    }

    private function safeZipSegment(string $value): string
    {
        $clean = preg_replace('/[\\\\\\/:*?"<>|]+/', '-', $value) ?? $value;
        $clean = trim($clean);
        if ($clean === '' || $clean === '.' || $clean === '..') {
            return 'file';
        }

        return $clean;
    }
}
