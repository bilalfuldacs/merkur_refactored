<?php

namespace App\Services;

use App\Models\StaticDoc;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class StaticDocStorage
{
    public function isManaged(StaticDoc $doc): bool
    {
        return is_file($this->managedPdfPath($doc));
    }

    public function pdfPath(StaticDoc $doc): ?string
    {
        $managed = $this->managedPdfPath($doc);

        return is_file($managed) ? $managed : $doc->legacyAssetPath('pdf');
    }

    public function thumbnailPath(StaticDoc $doc): ?string
    {
        $managed = $this->managedThumbnailPath($doc);

        return is_file($managed) ? $managed : $doc->legacyAssetPath('png');
    }

    public function storePdf(StaticDoc $doc, UploadedFile $file): void
    {
        $this->ensureDirectory($doc);
        $size = $file->getSize();
        $file->move($this->directory($doc), 'document.pdf');
        $stored = $this->managedPdfPath($doc);
        $doc->file_size = is_file($stored) ? filesize($stored) : $size;
        $doc->file = $doc->file ?: (Str::slug((string) $doc->title) ?: 'document');
    }

    public function storeThumbnail(StaticDoc $doc, UploadedFile $file): void
    {
        $this->ensureDirectory($doc);
        $target = $this->managedThumbnailPath($doc);
        $source = $file->getRealPath();
        if ($source === false) {
            $file->move($this->directory($doc), 'thumbnail.png');

            return;
        }

        $mime = (string) $file->getMimeType();
        if ($mime === 'image/png' || str_ends_with(strtolower($file->getClientOriginalName()), '.png')) {
            $file->move($this->directory($doc), 'thumbnail.png');

            return;
        }

        $image = match (true) {
            str_contains($mime, 'jpeg'), str_contains($mime, 'jpg') => @imagecreatefromjpeg($source),
            str_contains($mime, 'webp') && function_exists('imagecreatefromwebp') => @imagecreatefromwebp($source),
            default => false,
        };

        if ($image === false) {
            $file->move($this->directory($doc), 'thumbnail.png');

            return;
        }

        imagepng($image, $target);
        imagedestroy($image);
    }

    public function writePlaceholderThumbnail(StaticDoc $doc): void
    {
        if (! function_exists('imagecreatetruecolor') || is_file($this->managedThumbnailPath($doc))) {
            return;
        }

        $this->ensureDirectory($doc);

        $width = 800;
        $height = 450;
        $image = imagecreatetruecolor($width, $height);
        $navy = imagecolorallocate($image, 2, 32, 82);
        $cyan = imagecolorallocate($image, 0, 159, 227);
        $white = imagecolorallocate($image, 255, 255, 255);
        imagefill($image, 0, 0, $navy);
        imagefilledrectangle($image, 0, $height - 8, $width, $height, $cyan);

        $title = trim((string) $doc->title) ?: 'Document';
        $font = $this->fontPath();
        if ($font !== null && function_exists('imagettftext') && function_exists('imagettfbbox')) {
            $lines = explode("\n", wordwrap($title, 28));
            $lineHeight = 32;
            $startY = (int) (($height - (count($lines) * $lineHeight)) / 2);
            foreach ($lines as $index => $line) {
                $box = imagettfbbox(20, 0, $font, $line);
                $textWidth = $box === false ? 0 : $box[2] - $box[0];
                $x = (int) (($width - $textWidth) / 2);
                imagettftext($image, 20, 0, max(24, $x), $startY + ($index * $lineHeight) + 20, $white, $font, $line);
            }
        } else {
            imagestring($image, 5, 40, (int) ($height / 2) - 8, substr($title, 0, 40), $white);
        }

        imagepng($image, $this->managedThumbnailPath($doc));
        imagedestroy($image);
    }

    public function deleteManaged(StaticDoc $doc): void
    {
        $directory = $this->directory($doc);
        if (is_dir($directory)) {
            File::deleteDirectory($directory);
        }
    }

    private function directory(StaticDoc $doc): string
    {
        return storage_path('app/private/docs/'.$doc->id);
    }

    private function managedPdfPath(StaticDoc $doc): string
    {
        return $this->directory($doc).DIRECTORY_SEPARATOR.'document.pdf';
    }

    private function managedThumbnailPath(StaticDoc $doc): string
    {
        return $this->directory($doc).DIRECTORY_SEPARATOR.'thumbnail.png';
    }

    private function ensureDirectory(StaticDoc $doc): void
    {
        File::ensureDirectoryExists($this->directory($doc));
    }

    private function fontPath(): ?string
    {
        $candidates = [
            '/System/Library/Fonts/Supplemental/Arial.ttf',
            '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
            '/Library/Fonts/Arial.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        ];

        foreach ($candidates as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        return null;
    }
}
