<?php

namespace App\Services;

use App\Models\FeedbackSubmission;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;

class FeedbackStorage
{
    /**
     * @var list<string>
     */
    public const EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif'];

    public function store(FeedbackSubmission $feedback, UploadedFile $file): void
    {
        $this->deleteManaged($feedback);
        File::ensureDirectoryExists($this->directory($feedback));

        $ext = strtolower($file->getClientOriginalExtension() ?: 'png');
        if (! in_array($ext, self::EXTENSIONS, true)) {
            $ext = 'png';
        }

        $name = 'screenshot.'.$ext;
        $file->move($this->directory($feedback), $name);
        $feedback->attachment_path = 'feedback/'.$feedback->id.'/'.$name;
    }

    public function absolutePath(FeedbackSubmission $feedback): ?string
    {
        if (! $feedback->attachment_path) {
            return null;
        }

        $managed = $this->directory($feedback).DIRECTORY_SEPARATOR.basename($feedback->attachment_path);
        if (is_file($managed)) {
            return $managed;
        }

        $legacy = public_path($feedback->attachment_path);

        return is_file($legacy) ? $legacy : null;
    }

    public function deleteManaged(FeedbackSubmission $feedback): void
    {
        $directory = $this->directory($feedback);
        if (is_dir($directory)) {
            File::deleteDirectory($directory);
        }
    }

    private function directory(FeedbackSubmission $feedback): string
    {
        return storage_path('app/private/feedback/'.$feedback->id);
    }
}
