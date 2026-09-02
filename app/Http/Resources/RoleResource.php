<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'ID' => $this->ID,
            'name' => $this->name,
            'description' => $this->description,
            'needs_subscriptions' => $this->needs_subscriptions,
            'may_create-update_items' => $this->getAttribute('may_create-update_items'),
            'may_delete_items' => $this->may_delete_items,
            'may_create-update-delete_system-items' => $this->getAttribute('may_create-update-delete_system-items'),
            'may_use_tlp-red' => $this->getAttribute('may_use_tlp-red'),
            'may_access_unsubscribed-markets' => $this->getAttribute('may_access_unsubscribed-markets'),
        ];
    }
}
