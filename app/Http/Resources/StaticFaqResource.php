<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StaticFaqResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'ID' => $this->ID,
            'mod_date' => $this->mod_date,
            'mod_by' => $this->mod_by,
            'order' => $this->getAttribute('order'),
            'title' => $this->title,
            'article' => $this->article,
            'editor' => $this->whenLoaded('editor', fn () => $this->editor === null ? null : [
                'ID' => $this->editor->ID,
                'username' => $this->editor->username,
                'firstname' => $this->editor->firstname,
                'lastname' => $this->editor->lastname,
            ]),
        ];
    }
}
