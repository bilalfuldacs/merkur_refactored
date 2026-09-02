<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StaticDocResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $userId = $request->user()?->ID;
        $owned = $userId !== null && (int) $this->mod_by === (int) $userId;
        $uploaded = $this->isManaged();

        return [
            'id' => $this->id,
            'mod_by' => $this->mod_by,
            'title' => $this->title,
            'subfolder' => $this->subfolder,
            'description' => $this->description,
            'is_complete' => $this->is_complete,
            'file' => $this->file,
            'file_size' => $this->file_size,
            'upload_date' => $this->upload_date,
            'uploaded' => $uploaded,
            'can_edit' => $owned,
            'can_delete' => $owned && $this->isUserUpload(),
            'has_pdf' => $this->pdfPath() !== null,
            'has_thumbnail' => $this->thumbnailPath() !== null,
            'creator' => $this->whenLoaded('editor', fn () => $this->editor === null ? null : [
                'ID' => $this->editor->ID,
                'username' => $this->editor->username,
                'firstname' => $this->editor->firstname,
                'lastname' => $this->editor->lastname,
            ]),
        ];
    }
}
