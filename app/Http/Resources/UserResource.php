<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'ID' => $this->ID,
            'initials' => $this->initials,
            'name_COMBINED' => $this->name_COMBINED,
            'active' => $this->active,
            'lastname' => $this->lastname,
            'firstname' => $this->firstname,
            'prefix' => $this->prefix,
            'username' => $this->username,
            'bcolor' => $this->bcolor,
            'color' => $this->color,
            'role_ID' => $this->role_ID,
            'role' => new RoleResource($this->whenLoaded('role')),
            'beta' => $this->beta,
            'jobtitle' => $this->jobtitle,
            'birthday' => $this->birthday,
            'decolorize_avatars' => $this->decolorize_avatars,
            'appearance' => $this->appearance,
            'notifications' => $this->notifications,
            'last_ads_mail_timestamp' => $this->last_ads_mail_timestamp,
            'iceattendent2027' => (bool) $this->iceattendent2027,
        ];
    }
}
