<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunityCommentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $userId = $request->user()?->ID;

        return [
            'ID' => $this->ID,
            'mod_date' => $this->mod_date,
            'mod_by' => $this->mod_by,
            'post_ID' => $this->post_ID,
            'parent_ID' => $this->parent_ID,
            'note' => $this->note,
            'can_edit' => $userId !== null && (int) $this->mod_by === (int) $userId,
            'editor' => $this->whenLoaded('editor', fn () => $this->editor === null
                ? null
                : (new CommunityPersonResource($this->editor))->resolve()),
            'replies' => CommunityCommentResource::collection($this->whenLoaded('replies')),
        ];
    }
}
