<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'title',
    'subfolder',
    'file',
    'is_complete',
    'description',
    'file_size',
    'upload_date',
])]
class StaticDoc extends Model
{
    protected $table = 'static__docs';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(function (StaticDoc $doc): void {
            $doc->upload_date ??= now();
        });
    }

    public function getRouteKeyName(): string
    {
        return 'id';
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'upload_date' => 'datetime',
            'is_complete' => 'integer',
        ];
    }

    public function isOwnedBy(User $user): bool
    {
        return (int) $this->mod_by === (int) $user->ID;
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mod_by', 'ID');
    }

    public function thumbnailPath(): ?string
    {
        $managed = $this->managedPath('thumbnail.png');
        if (is_file($managed)) {
            return $managed;
        }

        return $this->legacyAssetPath('png');
    }

    public function pdfPath(): ?string
    {
        $managed = $this->managedPath('document.pdf');
        if (is_file($managed)) {
            return $managed;
        }

        return $this->legacyAssetPath('pdf');
    }

    public function isManaged(): bool
    {
        return is_file($this->managedPath('document.pdf'));
    }

    public function isUserUpload(): bool
    {
        return $this->isManaged() && $this->legacyAssetPath('pdf') === null && $this->legacyAssetPath('png') === null;
    }

    public function managedPath(string $name): string
    {
        return storage_path('app/private/docs/'.$this->id.DIRECTORY_SEPARATOR.$name);
    }

    public function legacyAssetPath(string $extension): ?string
    {
        if (! in_array($extension, ['pdf', 'png'], true)) {
            return null;
        }

        $subfolder = str_replace(['\\', "\0"], ['/', ''], (string) $this->subfolder);
        $file = str_replace("\0", '', (string) $this->file);

        $segments = array_values(array_filter(
            explode('/', $subfolder),
            fn (string $segment): bool => $segment !== ''
        ));

        foreach ($segments as $segment) {
            if ($segment === '.' || $segment === '..') {
                return null;
            }
        }

        if ($file === '' || str_contains($file, '/') || str_contains($file, '\\') || $file === '.' || $file === '..') {
            return null;
        }

        $base = config('merkur.assets_path');
        if (! is_string($base) || $base === '') {
            return null;
        }

        $docsRoot = rtrim($base, '/\\').DIRECTORY_SEPARATOR.'docs';
        $candidate = $docsRoot.DIRECTORY_SEPARATOR.implode(DIRECTORY_SEPARATOR, $segments).DIRECTORY_SEPARATOR.$file.'.'.$extension;

        $realDocs = realpath($docsRoot);
        $realFile = realpath($candidate);

        if ($realDocs === false || $realFile === false || ! str_starts_with($realFile, $realDocs.DIRECTORY_SEPARATOR)) {
            return null;
        }

        return $realFile;
    }
}
