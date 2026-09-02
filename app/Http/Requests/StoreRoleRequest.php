<?php

namespace App\Http\Requests;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Role::class) === true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:50', 'unique:config__roles,name'],
            'description' => ['required', 'string', 'max:280'],
            'needs_subscriptions' => ['sometimes', 'boolean'],
            'may_create-update_items' => ['required', 'boolean'],
            'may_delete_items' => ['required', 'boolean'],
            'may_create-update-delete_system-items' => ['required', 'boolean'],
            'may_use_tlp-red' => ['required', 'boolean'],
            'may_access_unsubscribed-markets' => ['required', 'boolean'],
        ];
    }
}
