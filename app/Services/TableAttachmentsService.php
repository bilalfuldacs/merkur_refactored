<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use InvalidArgumentException;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class TableAttachmentsService
{
    private const TLPS = ['red', 'amber', 'green', 'clear'];

    private const VIRTUAL_TABLES = ['roadmap'];

    private const MAX_BYTES = 104857600;

    /** @var array<string, array{label: string, group: string, span: int, hint: string}> */
    private const CLASS_CATALOG = [
        'feature-reelspins' => [
            'label' => 'Feature Reelspins',
            'group' => 'general',
            'span' => 6,
            'hint' => 'At game resolution',
        ],
        'screenshots' => [
            'label' => 'Screenshots',
            'group' => 'general',
            'span' => 6,
            'hint' => 'At game resolution: base game, bonuses, max win, jackpot sign',
        ],
        'buttons-headers-banners' => [
            'label' => 'Buttons, Headers, Banners',
            'group' => 'general',
            'span' => 6,
            'hint' => 'Game selection button and homepage / print header',
        ],
        'promo-video' => [
            'label' => 'Promo Video',
            'group' => 'general',
            'span' => 6,
            'hint' => 'See the Promo Video Guideline in Docs',
        ],
        'game-feature-symbols' => [
            'label' => 'Game & Feature Symbols',
            'group' => 'general',
            'span' => 12,
            'hint' => 'At least at game resolution',
        ],
        'jackpot-sign-assets' => [
            'label' => 'Jackpot Sign Assets',
            'group' => 'general',
            'span' => 12,
            'hint' => 'Marketing video for the jackpot sign, if applicable',
        ],
        'print-logos' => [
            'label' => 'Logos',
            'group' => 'print',
            'span' => 6,
            'hint' => 'At 300 dpi at intended print size',
        ],
        'print-background' => [
            'label' => 'Background',
            'group' => 'print',
            'span' => 6,
            'hint' => 'At 300 dpi at intended print size',
        ],
        '' => [
            'label' => 'Description & Other Assets',
            'group' => 'other',
            'span' => 12,
            'hint' => 'Uncategorized files',
        ],
    ];

    public function __construct(private TableViewSchemaService $schema) {}

    /**
     * @return array<string, mixed>
     */
    public function list(string $table, int $id, User $user): array
    {
        $view = $this->schema->payload($table, $user);
        $user->loadMissing('role');

        return $this->assemble($table, $id, $user, $view);
    }

    /**
     * @return array<string, mixed>
     */
    public function listVirtual(string $table, User $user): array
    {
        $this->assertVirtualTable($table);
        $user->loadMissing('role');

        return $this->assemble($table, null, $user, [
            'can_edit' => $user->canCreateUpdateItems(),
            'edit_extras' => '',
        ]);
    }

    /**
     * @param  array<string, mixed>  $view
     * @return array<string, mixed>
     */
    private function assemble(string $table, ?int $id, User $user, array $view): array
    {
        $usesHub = $this->usesAssetHub($table, $view);
        $files = [];
        $folders = [];
        $seen = [];
        foreach ($this->storageRoots() as $root) {
            foreach ($this->visibleTlps($user) as $tlp) {
                $base = $this->itemBase($root, $table, $tlp, $id);
                if (! is_dir($base)) {
                    continue;
                }
                $batch = [];
                $this->walk($base, $tlp, null, '', $batch, $folders);
                foreach ($batch as $file) {
                    $key = $file['tlp'].'|'.$file['asset_class'].'|'.($file['folder'] ?? '').'|'.$file['filename'];
                    if (isset($seen[$key])) {
                        continue;
                    }
                    $seen[$key] = true;
                    $files[] = $file;
                }
            }
        }

        usort($files, function (array $a, array $b): int {
            $class = strcmp((string) $a['asset_class'], (string) $b['asset_class']);
            if ($class !== 0) {
                return $class;
            }
            $tlp = array_search($a['tlp'], self::TLPS, true) <=> array_search($b['tlp'], self::TLPS, true);
            if ($tlp !== 0) {
                return $tlp;
            }

            return strcasecmp((string) $a['name'], (string) $b['name']);
        });

        $uploaderIds = array_values(array_unique(array_filter(array_column($files, 'uploader_id'))));
        $uploaders = $uploaderIds === []
            ? collect()
            : User::query()->whereIn('ID', $uploaderIds)->get()->keyBy('ID');

        foreach ($files as &$file) {
            $uploaderId = $file['uploader_id'];
            unset($file['uploader_id']);
            $uploader = $uploaderId ? $uploaders->get($uploaderId) : null;
            $file['uploader'] = $uploader instanceof User ? [
                'ID' => $uploader->ID,
                'initials' => $uploader->initials,
                'firstname' => $uploader->firstname,
                'lastname' => $uploader->lastname,
                'bcolor' => $uploader->bcolor,
                'color' => $uploader->color,
                'role_ID' => $uploader->role_ID,
            ] : null;
        }
        unset($file);

        return $this->payload($view, $user, $usesHub, $files, $folders);
    }

    public function upload(
        string $table,
        int $id,
        User $user,
        UploadedFile $file,
        string $tlp,
        string $assetClass = '',
        bool $featured = false,
    ): void {
        $view = $this->schema->payload($table, $user);
        $user->loadMissing('role');

        if (! ($view['can_edit'] ?? false)) {
            abort(403, 'You cannot add assets to this table.');
        }
        if ($tlp === 'red' && ! $user->canUseTlpRed()) {
            throw new InvalidArgumentException('You cannot upload TLP:RED assets.');
        }
        if (! in_array($tlp, self::TLPS, true)) {
            throw new InvalidArgumentException('Choose a valid TLP level.');
        }

        $usesHub = $this->usesAssetHub($table, $view);
        $this->putUploadedFile($table, $id, $user, $file, $tlp, $assetClass, $featured, $usesHub);
    }

    public function uploadVirtual(
        string $table,
        User $user,
        UploadedFile $file,
        string $tlp,
        string $assetClass = '',
        bool $featured = false,
    ): void {
        $this->assertVirtualTable($table);
        $user->loadMissing('role');
        if (! $user->canCreateUpdateItems()) {
            abort(403, 'You cannot add assets to this table.');
        }
        if ($tlp === 'red' && ! $user->canUseTlpRed()) {
            throw new InvalidArgumentException('You cannot upload TLP:RED assets.');
        }
        if (! in_array($tlp, self::TLPS, true)) {
            throw new InvalidArgumentException('Choose a valid TLP level.');
        }

        $this->putUploadedFile($table, null, $user, $file, $tlp, $assetClass, $featured, false);
    }

    public function downloadVirtual(string $table, User $user, array $query, bool $asDownload): BinaryFileResponse
    {
        $this->assertVirtualTable($table);
        $user->loadMissing('role');

        $tlp = (string) ($query['tlp'] ?? '');
        if (! in_array($tlp, $this->visibleTlps($user), true)) {
            throw new InvalidArgumentException('Unknown asset.');
        }

        $assetClass = $this->safeClass($query['ac'] ?? null);
        $folder = $this->safeFolder($query['sf'] ?? '');
        $filename = $this->safeFilename((string) ($query['f'] ?? ''));
        if ($filename === '') {
            throw new InvalidArgumentException('Unknown asset.');
        }

        $path = $this->filePath($table, null, $tlp, $assetClass, $folder, $filename);
        if (! is_file($path)) {
            throw new InvalidArgumentException('Unknown asset.');
        }

        $display = $this->parseFileName($filename)['name'];
        $mime = mime_content_type($path) ?: 'application/octet-stream';

        if ($asDownload) {
            return response()->download($path, $display, [
                'Content-Type' => $mime,
            ]);
        }

        return response()->file($path, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="'.$display.'"',
        ]);
    }

    /**
     * Flat (non-recursive) docs-package files for a game. Always excludes TLP:RED.
     *
     * @return list<array{filename: string, name: string, tlp: string, tlp_label: string, size: int, size_label: string}>
     */
    public function listFlatGameDocs(int $gameId, User $user): array
    {
        $user->loadMissing('role');
        $this->schema->payload('games', $user);

        $files = [];
        $seen = [];
        foreach ($this->storageRoots() as $root) {
            foreach (['amber', 'green', 'clear'] as $tlp) {
                $base = $this->itemBase($root, 'games', $tlp, $gameId);
                if (! is_dir($base)) {
                    continue;
                }
                foreach (File::files($base) as $entry) {
                    $name = $entry->getFilename();
                    if (str_ends_with(strtolower($name), '.json')) {
                        continue;
                    }
                    $parsed = $this->parseFileName($name);
                    if ($parsed['deleted_at'] !== null) {
                        continue;
                    }
                    $key = $tlp.'|'.$name;
                    if (isset($seen[$key])) {
                        continue;
                    }
                    $seen[$key] = true;
                    $files[] = [
                        'filename' => $name,
                        'name' => $parsed['name'],
                        'tlp' => $tlp,
                        'tlp_label' => $this->tlpLabel($tlp),
                        'size' => $entry->getSize(),
                        'size_label' => $this->niceSize($entry->getSize()),
                    ];
                }
            }
        }

        usort($files, function (array $a, array $b): int {
            $byName = strcasecmp((string) $a['name'], (string) $b['name']);
            if ($byName !== 0) {
                return $byName;
            }

            return strcmp((string) $a['tlp'], (string) $b['tlp']);
        });

        return $files;
    }

    /**
     * Resolve an absolute path for a flat (root-level) game attachment. TLP:RED is never allowed.
     */
    public function resolveFlatGameDocPath(int $gameId, string $tlp, string $filename): string
    {
        if (! in_array($tlp, ['amber', 'green', 'clear'], true)) {
            throw new InvalidArgumentException('Unknown asset.');
        }

        $safeName = $this->safeFilename($filename);
        if ($safeName === '') {
            throw new InvalidArgumentException('Unknown asset.');
        }

        return $this->filePath('games', $gameId, $tlp, null, '', $safeName);
    }

    public function download(string $table, int $id, User $user, array $query, bool $asDownload): BinaryFileResponse
    {
        $this->schema->payload($table, $user);
        $user->loadMissing('role');

        $tlp = (string) ($query['tlp'] ?? '');
        if (! in_array($tlp, $this->visibleTlps($user), true)) {
            throw new InvalidArgumentException('Unknown asset.');
        }

        $assetClass = $this->safeClass($query['ac'] ?? null);
        $folder = $this->safeFolder($query['sf'] ?? '');
        $filename = $this->safeFilename((string) ($query['f'] ?? ''));
        if ($filename === '') {
            throw new InvalidArgumentException('Unknown asset.');
        }

        $path = $this->filePath($table, $id, $tlp, $assetClass, $folder, $filename);
        if (! is_file($path)) {
            throw new InvalidArgumentException('Unknown asset.');
        }

        $display = $this->parseFileName($filename)['name'];
        $mime = mime_content_type($path) ?: 'application/octet-stream';

        if ($asDownload) {
            return response()->download($path, $display, [
                'Content-Type' => $mime,
            ]);
        }

        return response()->file($path, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="'.$display.'"',
        ]);
    }

    /**
     * @param  array<string, mixed>  $view
     * @param  list<array<string, mixed>>  $files
     * @return array<string, mixed>
     */
    /**
     * @param  array<string, mixed>  $view
     * @param  list<array<string, mixed>>  $files
     * @param  list<array{tlp: string, asset_class: string, path: string}>  $folders
     * @return array<string, mixed>
     */
    private function payload(array $view, User $user, bool $usesHub, array $files, array $folders = []): array
    {
        $catalogKeys = $usesHub ? array_keys(self::CLASS_CATALOG) : [''];
        $classes = [];
        foreach ($catalogKeys as $key) {
            $meta = self::CLASS_CATALOG[$key];
            $classes[$key] = [
                'key' => $key,
                'label' => $meta['label'],
                'group' => $meta['group'],
                'span' => $meta['span'],
                'hint' => $meta['hint'],
                'files' => [],
                'folders' => [],
            ];
        }
        foreach ($files as $file) {
            $key = (string) $file['asset_class'];
            if (! isset($classes[$key])) {
                $classes[$key] = [
                    'key' => $key,
                    'label' => $this->titleFromClass($key),
                    'group' => 'other',
                    'span' => 12,
                    'hint' => '',
                    'files' => [],
                    'folders' => [],
                ];
            }
            $classes[$key]['files'][] = $file;
        }

        $folderSeen = [];
        foreach ($folders as $folder) {
            $classKey = (string) ($folder['asset_class'] ?? '');
            $path = (string) ($folder['path'] ?? '');
            $tlp = (string) ($folder['tlp'] ?? '');
            if ($path === '' || $tlp === '') {
                continue;
            }
            if (! isset($classes[$classKey])) {
                $classes[$classKey] = [
                    'key' => $classKey,
                    'label' => $this->titleFromClass($classKey),
                    'group' => 'other',
                    'span' => 12,
                    'hint' => '',
                    'files' => [],
                    'folders' => [],
                ];
            }
            $dedupe = $classKey.'|'.$tlp.'|'.$path;
            if (isset($folderSeen[$dedupe])) {
                continue;
            }
            $folderSeen[$dedupe] = true;
            $classes[$classKey]['folders'][] = [
                'tlp' => $tlp,
                'path' => $path,
            ];
        }

        foreach ($classes as &$class) {
            usort($class['folders'], function (array $a, array $b): int {
                $tlp = array_search($a['tlp'], self::TLPS, true) <=> array_search($b['tlp'], self::TLPS, true);
                if ($tlp !== 0) {
                    return $tlp;
                }

                return strcasecmp((string) $a['path'], (string) $b['path']);
            });
        }
        unset($class);

        $canEdit = (bool) ($view['can_edit'] ?? false);

        return [
            'files' => count($files),
            'can_upload' => $canEdit,
            'can_modify' => $canEdit,
            'can_use_tlp_red' => $user->canUseTlpRed(),
            'uses_asset_hub' => $usesHub,
            'max_bytes' => min(self::MAX_BYTES, UploadedFile::getMaxFilesize()),
            'classes' => array_values($classes),
            'mood_board' => $usesHub ? $this->moodBoard($files) : null,
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $files
     * @return array{screenshots: list<array<string, mixed>|null>, banner: array<string, mixed>|null}
     */
    private function moodBoard(array $files): array
    {
        $screenshots = $this->featuredInClass($files, 'screenshots', 3);
        $banners = $this->featuredInClass($files, 'buttons-headers-banners', 1);

        return [
            'screenshots' => [
                $screenshots[0] ?? null,
                $screenshots[1] ?? null,
                $screenshots[2] ?? null,
            ],
            'banner' => $banners[0] ?? null,
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $files
     * @return list<array<string, mixed>>
     */
    private function featuredInClass(array $files, string $class, int $limit): array
    {
        $matches = array_values(array_filter(
            $files,
            fn (array $file): bool => ($file['asset_class'] ?? '') === $class
                && ! empty($file['featured'])
                && ! empty($file['is_image']),
        ));
        usort($matches, function (array $a, array $b): int {
            $order = array_search($a['tlp'], self::RESOLVE_TLPS, true) <=> array_search($b['tlp'], self::RESOLVE_TLPS, true);
            if ($order !== 0) {
                return $order;
            }

            return strcmp((string) $a['uploaded_at'], (string) $b['uploaded_at']);
        });

        return array_slice($matches, 0, $limit);
    }

    /**
     * @param  array<string, mixed>  $view
     */
    private function usesAssetHub(string $table, array $view): bool
    {
        $extras = (string) ($view['edit_extras'] ?? '');

        return $extras === 'games_files' || in_array($table, ['games', 'features'], true);
    }

    private function normalizeClass(string $assetClass, bool $usesHub): string
    {
        $assetClass = trim($assetClass);
        if ($assetClass === '') {
            return '';
        }
        if (! preg_match('/^[A-Za-z0-9][A-Za-z0-9_-]*$/', $assetClass)) {
            throw new InvalidArgumentException('Unknown asset class.');
        }
        if (! $usesHub && $assetClass !== '') {
            throw new InvalidArgumentException('This table only accepts uncategorized assets.');
        }
        if ($usesHub && ! array_key_exists($assetClass, self::CLASS_CATALOG)) {
            throw new InvalidArgumentException('Unknown asset class.');
        }

        return $assetClass;
    }

    private function safeDisplayName(string $original): string
    {
        $name = basename(str_replace('\\', '/', $original));
        if ($name === '' || $name === '.' || $name === '..') {
            throw new InvalidArgumentException('Your item name contains disallowed characters.');
        }
        if (preg_match("/^[-–—+ '‘’“”_.,!)(&\\p{L}0-9]{1,100}$/u", $name) === 1) {
            return $name;
        }

        $clean = preg_replace("/[^-–—+ '‘’“”_.,!)(&\\p{L}0-9]/u", '-', $name) ?? '';
        $clean = trim($clean, '-. ');
        if ($clean === '') {
            throw new InvalidArgumentException('Your item name contains disallowed characters.');
        }

        return mb_substr($clean, 0, 100);
    }

    private function assertRecognizedFile(UploadedFile $file): void
    {
        if (! $file->isValid()) {
            throw new InvalidArgumentException('The file could not be uploaded.');
        }
        if ($file->getSize() === 0) {
            throw new InvalidArgumentException('Empty item.');
        }
        if ($file->getSize() > self::MAX_BYTES) {
            throw new InvalidArgumentException('Item too large.');
        }
        if ($this->detectFormat($file->getRealPath() ?: '') === null) {
            throw new InvalidArgumentException(
                'Your item ‘'.$this->safeDisplayName((string) $file->getClientOriginalName()).'’ could not be uploaded as it is not a PDF, JPG, PNG, MP3, or MP4 file.'
            );
        }
    }

    private function detectFormat(string $path): ?string
    {
        if ($path === '' || ! is_file($path)) {
            return null;
        }
        $handle = fopen($path, 'rb');
        if ($handle === false) {
            return null;
        }
        $signature = fread($handle, 12);
        fclose($handle);
        if ($signature === false || strlen($signature) < 8) {
            return null;
        }

        $head = substr($signature, 0, 3);
        if ($head === '%PD') {
            return 'pdf';
        }
        if ($head === "\xff\xd8\xff") {
            return 'jpg';
        }
        if ($head === "\x89PN") {
            return 'png';
        }
        if ($head === 'ID3') {
            return 'mp3';
        }
        $mpeg = ord($signature[0]) === 0xFF && (ord($signature[1]) & 0xE0) === 0xE0;
        if ($mpeg) {
            return 'mp3';
        }
        if (substr($signature, 4, 4) === 'ftyp') {
            return 'mp4';
        }

        return null;
    }

    private function putUploadedFile(
        string $table,
        ?int $id,
        User $user,
        UploadedFile $file,
        string $tlp,
        string $assetClass,
        bool $featured,
        bool $usesHub,
    ): void {
        $assetClass = $this->normalizeClass($assetClass, $usesHub);
        $displayName = $this->safeDisplayName((string) $file->getClientOriginalName());
        $this->assertRecognizedFile($file);

        $directory = null;
        $legacy = $this->assetsRoot();
        if ($legacy !== null) {
            $candidate = $this->classDirectory($legacy, $table, $id, $tlp, $assetClass);
            if ($this->ensureDirectory($candidate)) {
                $directory = $candidate;
            }
        }
        if ($directory === null) {
            $directory = $this->classDirectory($this->localRoot(), $table, $id, $tlp, $assetClass);
            if (! $this->ensureDirectory($directory)) {
                throw new RuntimeException('The asset folder could not be created.');
            }
        }

        $storedName = $user->ID.'~'.time().'~~'.$displayName;
        try {
            $file->move($directory, $storedName);
        } catch (\Throwable) {
            throw new RuntimeException('The file could not be saved.');
        }

        if ($featured) {
            $this->writeSidecar($directory.DIRECTORY_SEPARATOR.$storedName.'.json', true);
        }
    }

    private function assertVirtualTable(string $table): void
    {
        if (! in_array($table, self::VIRTUAL_TABLES, true)) {
            throw new InvalidArgumentException('Unknown table.');
        }
    }

    private function itemBase(string $root, string $table, string $tlp, ?int $id): string
    {
        $parts = [$root, $table, $tlp];
        if ($id !== null) {
            $parts[] = (string) $id;
        }

        return implode(DIRECTORY_SEPARATOR, $parts);
    }

    private function writeSidecar(string $path, bool $featured): void
    {
        $json = json_encode([
            'description' => '',
            'draft' => false,
            'featured' => $featured,
        ], JSON_THROW_ON_ERROR);
        if (file_put_contents($path, $json) === false) {
            throw new RuntimeException('The asset could not be marked for the mood board.');
        }
    }

    /**
     * @param  list<array<string, mixed>>  $files
     */
    /**
     * @param  list<array<string, mixed>>  $files
     * @param  list<array{tlp: string, asset_class: string, path: string}>  $folders
     */
    private function walk(string $directory, string $tlp, ?string $assetClass, string $folder, array &$files, array &$folders = []): void
    {
        $entries = File::files($directory);
        foreach ($entries as $entry) {
            $name = $entry->getFilename();
            if (str_ends_with(strtolower($name), '.json')) {
                continue;
            }

            $parsed = $this->parseFileName($name);
            if ($parsed['deleted_at'] !== null) {
                continue;
            }

            $sidecar = $this->readSidecar($entry->getPathname().'.json');
            $files[] = [
                'filename' => $name,
                'name' => $parsed['name'],
                'tlp' => $tlp,
                'tlp_label' => $this->tlpLabel($tlp),
                'asset_class' => $assetClass ?? '',
                'folder' => $folder === '' ? null : $folder,
                'size' => $entry->getSize(),
                'size_label' => $this->niceSize($entry->getSize()),
                'uploaded_at' => $parsed['uploaded_at'],
                'description' => $sidecar['description'],
                'draft' => $sidecar['draft'],
                'featured' => $sidecar['featured'],
                'is_image' => $this->isImage($name),
                'uploader_id' => $parsed['user_id'],
            ];
        }

        foreach (File::directories($directory) as $child) {
            $name = basename($child);
            if ($name === '.' || $name === '..') {
                continue;
            }
            if (str_starts_with($name, '~') && $assetClass === null) {
                $this->walk($child, $tlp, substr($name, 1), '', $files, $folders);
                continue;
            }

            $nextFolder = $folder === '' ? $name : $folder.'/'.$name;
            $folders[] = [
                'tlp' => $tlp,
                'asset_class' => $assetClass ?? '',
                'path' => $nextFolder,
            ];
            $this->walk($child, $tlp, $assetClass, $nextFolder, $files, $folders);
        }
    }

    /**
     * @return array{user_id: int|null, uploaded_at: string|null, deleted_at: string|null, name: string}
     */
    private function parseFileName(string $rawName): array
    {
        if (preg_match('/^(.+)~(.+)~(.*)~(.*)$/', $rawName, $matches) === 1) {
            $deleted = $matches[3] !== '' ? (int) $matches[3] : null;

            return [
                'user_id' => is_numeric($matches[1]) ? (int) $matches[1] : null,
                'uploaded_at' => is_numeric($matches[2]) ? date('Y-m-d H:i:s', (int) $matches[2]) : null,
                'deleted_at' => $deleted ? date('Y-m-d H:i:s', $deleted) : null,
                'name' => $matches[4],
            ];
        }

        return [
            'user_id' => null,
            'uploaded_at' => null,
            'deleted_at' => null,
            'name' => $rawName,
        ];
    }

    /**
     * @return array{description: string|null, draft: bool, featured: bool}
     */
    private function readSidecar(string $path): array
    {
        $empty = ['description' => null, 'draft' => false, 'featured' => false];
        if (! is_file($path)) {
            return $empty;
        }

        $data = json_decode((string) file_get_contents($path));
        if (! is_object($data)) {
            return $empty;
        }

        return [
            'description' => isset($data->description) && is_string($data->description) && $data->description !== ''
                ? $data->description
                : null,
            'draft' => (bool) ($data->draft ?? false),
            'featured' => (bool) ($data->featured ?? false),
        ];
    }

    /**
     * @return list<string>
     */
    private function visibleTlps(User $user): array
    {
        return $user->canUseTlpRed()
            ? self::TLPS
            : ['amber', 'green', 'clear'];
    }

    private function assetsRoot(): ?string
    {
        $base = config('merkur.assets_path');
        if (! is_string($base) || $base === '') {
            return null;
        }

        return rtrim($base, '/\\');
    }

    private function localRoot(): string
    {
        return storage_path('app/private/table-assets');
    }

    /**
     * @return list<string>
     */
    private function storageRoots(): array
    {
        $roots = [];
        $local = $this->localRoot();
        if (is_dir($local)) {
            $roots[] = $local;
        }
        $legacy = $this->assetsRoot();
        if ($legacy !== null && is_dir($legacy) && $legacy !== $local) {
            $roots[] = $legacy;
        }

        return $roots;
    }

    private function ensureDirectory(string $directory): bool
    {
        if (is_dir($directory)) {
            return true;
        }

        try {
            return @mkdir($directory, 0755, true) || is_dir($directory);
        } catch (\Throwable) {
            return is_dir($directory);
        }
    }

    private function classDirectory(string $root, string $table, ?int $id, string $tlp, string $assetClass): string
    {
        $parts = [$root, $table, $tlp];
        if ($id !== null) {
            $parts[] = (string) $id;
        }
        if ($assetClass !== '') {
            $parts[] = '~'.$assetClass;
        }

        return implode(DIRECTORY_SEPARATOR, $parts);
    }

    private function filePath(string $table, ?int $id, string $tlp, ?string $assetClass, string $folder, string $filename): string
    {
        foreach ($this->storageRoots() as $root) {
            $parts = [$root, $table, $tlp];
            if ($id !== null) {
                $parts[] = (string) $id;
            }
            if ($assetClass !== null && $assetClass !== '') {
                $parts[] = '~'.$assetClass;
            }
            if ($folder !== '') {
                $parts = array_merge($parts, explode('/', $folder));
            }
            $parts[] = $filename;
            $candidate = implode(DIRECTORY_SEPARATOR, $parts);
            $realRoot = realpath($root);
            $realFile = realpath($candidate);
            if ($realRoot === false || $realFile === false || ! str_starts_with($realFile, $realRoot.DIRECTORY_SEPARATOR)) {
                continue;
            }

            return $realFile;
        }

        throw new InvalidArgumentException('Unknown asset.');
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function modify(string $table, ?int $id, User $user, array $input): array
    {
        $user->loadMissing('role');
        if ($id === null) {
            $this->assertVirtualTable($table);
            $view = [
                'can_edit' => $user->canCreateUpdateItems(),
                'edit_extras' => '',
            ];
        } else {
            $view = $this->schema->payload($table, $user);
        }
        if (! ($view['can_edit'] ?? false)) {
            abort(403, 'You cannot change assets on this table.');
        }

        $tlp = (string) ($input['tlp'] ?? '');
        if (! in_array($tlp, $this->visibleTlps($user), true)) {
            throw new InvalidArgumentException('Unknown asset.');
        }

        $assetClass = $this->safeClass($input['ac'] ?? null) ?? '';
        $folder = $this->safeFolder($input['sf'] ?? ($input['folder'] ?? ''));

        if (array_key_exists('folder_create', $input) && is_string($input['folder_create']) && $input['folder_create'] !== '') {
            $created = $this->safeFolderCreateName($input['folder_create']);
            $targetFolder = $folder === '' ? $created : $folder.'/'.$created;
            $this->writableClassDirectory($table, $id, $tlp, $assetClass, $targetFolder);

            return $id === null
                ? $this->listVirtual($table, $user)
                : $this->list($table, $id, $user);
        }

        $filename = $this->safeFilename((string) ($input['f'] ?? ($input['name'] ?? '')));
        if ($filename === '') {
            throw new InvalidArgumentException('Unknown asset.');
        }

        $current = $this->filePath($table, $id, $tlp, $assetClass, $folder, $filename);
        $sidecar = $current.'.json';

        if (array_key_exists('description', $input) || array_key_exists('featured', $input) || array_key_exists('draft', $input)) {
            $meta = $this->readSidecar($sidecar);
            if (array_key_exists('description', $input)) {
                $meta['description'] = is_string($input['description']) ? $input['description'] : '';
            }
            if (array_key_exists('featured', $input)) {
                $meta['featured'] = (bool) $input['featured'];
            }
            if (array_key_exists('draft', $input)) {
                $meta['draft'] = (bool) $input['draft'];
            }
            $this->writeSidecarFull($sidecar, $meta);
        }

        $trash = ! empty($input['delete']);
        $tlpNew = isset($input['tlp_new']) && in_array((string) $input['tlp_new'], self::TLPS, true)
            ? (string) $input['tlp_new']
            : $tlp;
        if ($tlpNew === 'red' && ! $user->canUseTlpRed()) {
            throw new InvalidArgumentException('You cannot move assets to TLP:RED.');
        }
        $classNew = array_key_exists('ac_new', $input)
            ? ($this->safeClass($input['ac_new']) ?? '')
            : $assetClass;
        $folderNew = array_key_exists('sf_new', $input) || array_key_exists('folder_new', $input)
            ? $this->safeFolder($input['sf_new'] ?? ($input['folder_new'] ?? ''))
            : $folder;
        $nameNew = is_string($input['name_new'] ?? null) && $input['name_new'] !== ''
            ? $this->safeDisplayName((string) $input['name_new'])
            : null;

        $parsed = $this->parseFileName($filename);
        $filenameNew = $filename;
        if ($trash || $nameNew !== null) {
            $userPart = $parsed['user_id'] ?? 0;
            $uploadedStamp = $parsed['uploaded_at'] ? strtotime($parsed['uploaded_at']) : time();
            $display = $nameNew ?? $parsed['name'];
            $deletedStamp = $trash ? time() : '';
            $filenameNew = $userPart.'~'.$uploadedStamp.'~'.$deletedStamp.'~'.$display;
        }

        $needsMove = $trash
            || $tlpNew !== $tlp
            || $classNew !== $assetClass
            || $folderNew !== $folder
            || $filenameNew !== $filename;

        if ($needsMove) {
            $directory = $this->writableClassDirectory($table, $id, $tlpNew, $classNew, $folderNew);
            $target = $directory.DIRECTORY_SEPARATOR.$filenameNew;
            if (is_file($target) && realpath($target) !== realpath($current)) {
                throw new InvalidArgumentException('A file with this name already exists at that location.');
            }
            if (! @rename($current, $target)) {
                throw new RuntimeException('The asset could not be moved.');
            }
            if (is_file($sidecar)) {
                @rename($sidecar, $target.'.json');
            }
        }

        return $id === null
            ? $this->listVirtual($table, $user)
            : $this->list($table, $id, $user);
    }

    /**
     * @return array<string, int>
     */
    public function classImageCounts(string $table, int $id, array $classes): array
    {
        $counts = array_fill_keys($classes, 0);
        foreach ($this->storageRoots() as $root) {
            foreach (self::TLPS as $tlp) {
                foreach ($classes as $class) {
                    $directory = $this->classDirectory($root, $table, $id, $tlp, $class);
                    if (! is_dir($directory)) {
                        continue;
                    }
                    foreach (File::files($directory) as $entry) {
                        $name = $entry->getFilename();
                        if (str_ends_with(strtolower($name), '.json')) {
                            continue;
                        }
                        $parsed = $this->parseFileName($name);
                        if ($parsed['deleted_at'] !== null || ! $this->isImage($name)) {
                            continue;
                        }
                        $counts[$class]++;
                    }
                }
            }
        }

        return $counts;
    }

    /**
     * @param  array{description: string|null, draft: bool, featured: bool}  $meta
     */
    private function writeSidecarFull(string $path, array $meta): void
    {
        $json = json_encode([
            'description' => $meta['description'] ?? '',
            'draft' => (bool) ($meta['draft'] ?? false),
            'featured' => (bool) ($meta['featured'] ?? false),
        ], JSON_THROW_ON_ERROR);
        if (file_put_contents($path, $json) === false) {
            throw new RuntimeException('The asset details could not be saved.');
        }
    }

    private function writableClassDirectory(string $table, ?int $id, string $tlp, string $assetClass, string $folder): string
    {
        $legacy = $this->assetsRoot();
        $roots = [];
        if ($legacy !== null) {
            $roots[] = $legacy;
        }
        $roots[] = $this->localRoot();

        $directory = null;
        foreach ($roots as $root) {
            $candidate = $this->classDirectory($root, $table, $id, $tlp, $assetClass);
            if ($folder !== '') {
                $candidate .= DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $folder);
            }
            if ($this->ensureDirectory($candidate)) {
                $directory = $candidate;
                break;
            }
        }
        if ($directory === null) {
            throw new RuntimeException('The asset folder could not be created.');
        }

        return $directory;
    }

    private function safeClass(mixed $value): ?string
    {
        if (! is_string($value) || $value === '') {
            return null;
        }
        if (! preg_match('/^[A-Za-z0-9][A-Za-z0-9_-]*$/', $value)) {
            throw new InvalidArgumentException('Unknown asset.');
        }

        return $value;
    }

    private function safeFolder(mixed $value): string
    {
        $raw = is_string($value) ? trim($value, '/') : '';
        if ($raw === '') {
            return '';
        }
        foreach (explode('/', $raw) as $segment) {
            if ($segment === '' || $segment === '.' || $segment === '..' || str_contains($segment, '\\')) {
                throw new InvalidArgumentException('Unknown asset.');
            }
            if (preg_match('/^[-+ ()\p{L}0-9]{1,100}$/u', $segment) !== 1) {
                throw new InvalidArgumentException('Folder name may only contain letters, digits, spaces, and - / ( ).');
            }
        }

        return $raw;
    }

    private function safeFolderCreateName(string $value): string
    {
        $raw = trim(str_replace('\\', '/', $value), '/');
        if ($raw === '' || preg_match('/^[-+ \/)(\p{L}0-9]{1,100}$/u', $raw) !== 1) {
            throw new InvalidArgumentException('Folder name may only contain letters, digits, spaces, and - / ( ).');
        }

        return $this->safeFolder($raw);
    }

    private function safeFilename(string $value): string
    {
        $name = basename(str_replace('\\', '/', $value));
        if ($name === '' || $name === '.' || $name === '..') {
            return '';
        }

        return $name;
    }

    private function niceSize(int $size): string
    {
        if ($size > 0x100000) {
            return round($size / 0x100000, 1).' MB';
        }
        if ($size > 0x400) {
            return round($size / 0x400, 1).' KB';
        }

        return $size.' B';
    }

    private function isImage(string $filename): bool
    {
        return (bool) preg_match('/\.(jpe?g|png|gif|webp)$/i', $filename);
    }

    private function tlpLabel(string $tlp): string
    {
        return match ($tlp) {
            'red' => 'TLP:RED',
            'amber' => 'TLP:AMBER',
            'green' => 'TLP:GREEN',
            default => 'TLP:CLEAR',
        };
    }

    private function titleFromClass(string $key): string
    {
        if ($key === '') {
            return 'Description & Other Assets';
        }

        return ucwords(str_replace(['-', '_'], ' ', $key));
    }

    /**
     * Soft-deleted assets use the name pattern userId~uploadedAt~deletedAt~displayName
     * (third segment non-empty). Active files keep an empty deleted stamp (~~).
     *
     * @return list<array{path: string, relative: string, name: string, deleted_at: string|null, size: int}>
     */
    public function listTrashed(): array
    {
        $items = [];
        foreach ($this->storageRoots() as $root) {
            if (! is_dir($root)) {
                continue;
            }
            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS)
            );
            foreach ($iterator as $file) {
                if (! $file->isFile()) {
                    continue;
                }
                $name = $file->getFilename();
                if (str_ends_with(strtolower($name), '.json')) {
                    continue;
                }
                // Match original admin trash finder: digits~digits~digits~…
                if (preg_match('/^\d+~\d+~\d+.+/', $name) !== 1) {
                    continue;
                }
                $parsed = $this->parseFileName($name);
                $absolute = $file->getPathname();
                $items[] = [
                    'path' => $absolute,
                    'relative' => ltrim(str_replace('\\', '/', substr($absolute, strlen($root))), '/'),
                    'name' => $parsed['name'],
                    'deleted_at' => $parsed['deleted_at'],
                    'size' => (int) $file->getSize(),
                ];
            }
        }

        usort($items, fn (array $a, array $b): int => strcmp($a['relative'], $b['relative']));

        return $items;
    }

    /**
     * Hard-delete soft-trashed attachment files (and sidecar .json when present).
     *
     * @param  list<string>|null  $paths  Absolute paths; null or empty = purge all trashed.
     * @return array{purged: int, missing: int}
     */
    public function purgeTrashed(?array $paths = null): array
    {
        $trashed = $this->listTrashed();
        $byPath = [];
        foreach ($trashed as $item) {
            $byPath[$item['path']] = $item;
        }

        $targets = $paths === null || $paths === []
            ? array_keys($byPath)
            : array_values(array_unique(array_filter($paths, 'is_string')));

        $purged = 0;
        $missing = 0;
        foreach ($targets as $path) {
            $candidate = isset($byPath[$path]) ? $path : null;
            if ($candidate === null) {
                $real = realpath($path);
                if ($real !== false && isset($byPath[$real])) {
                    $candidate = $real;
                }
            }
            if ($candidate === null || ! is_file($candidate) || ! $this->isUnderStorageRoot($candidate)) {
                $missing++;
                continue;
            }
            if (@unlink($candidate)) {
                $purged++;
                $sidecar = $candidate.'.json';
                if (is_file($sidecar)) {
                    @unlink($sidecar);
                }
            } else {
                $missing++;
            }
        }

        return ['purged' => $purged, 'missing' => $missing];
    }

    private function isUnderStorageRoot(string $path): bool
    {
        $real = realpath($path);
        if ($real === false) {
            return false;
        }
        foreach ($this->storageRoots() as $root) {
            $rootReal = realpath($root);
            if ($rootReal === false) {
                continue;
            }
            if (str_starts_with($real, rtrim($rootReal, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR)) {
                return true;
            }
        }

        return false;
    }
}
