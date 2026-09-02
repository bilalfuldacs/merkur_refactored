<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunityPersonResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'ID' => $this->ID,
            'username' => $this->username,
            'firstname' => $this->firstname,
            'lastname' => $this->lastname,
            'initials' => $this->initials,
            'jobtitle' => $this->jobtitle,
            'bcolor' => $this->bcolor,
            'color' => $this->color,
            'role_ID' => $this->role_ID,
        ];
    }
}
