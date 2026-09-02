<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunityPostResource extends JsonResource
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
            'table' => $this->getAttribute('table'),
            'item_ID' => $this->item_ID,
            'note' => $this->note,
            'num_comments' => $this->num_comments,
            'num_replies' => $this->num_replies,
            'num_likes' => $this->num_likes,
            'num_dislikes' => $this->num_dislikes,
            'num_bookmarks' => $this->num_bookmarks,
            'my_like' => $this->when(isset($this->resource->my_like), fn () => (bool) $this->resource->my_like),
            'my_dislike' => $this->when(isset($this->resource->my_dislike), fn () => (bool) $this->resource->my_dislike),
            'my_bookmark' => $this->when(isset($this->resource->my_bookmark), fn () => (bool) $this->resource->my_bookmark),
            'can_edit' => $userId !== null && (int) $this->mod_by === (int) $userId,
            'editor' => $this->whenLoaded('editor', fn () => $this->editor === null
                ? null
                : (new CommunityPersonResource($this->editor))->resolve()),
            'comments' => CommunityCommentResource::collection($this->whenLoaded('comments')),
            'liked_by' => $this->whenLoaded('activeLikes', fn () => CommunityPersonResource::collection(
                $this->activeLikes->pluck('editor')->filter()->unique('ID')->values()
            )),
            'disliked_by' => $this->whenLoaded('activeDislikes', fn () => CommunityPersonResource::collection(
                $this->activeDislikes->pluck('editor')->filter()->unique('ID')->values()
            )),
            'commented_by' => $this->whenLoaded('comments', fn () => CommunityPersonResource::collection(
                $this->comments->pluck('editor')->filter()->unique('ID')->values()
            )),
        ];
    }
}
