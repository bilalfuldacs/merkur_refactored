<?php

namespace App\Http\Requests;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->route('role');

        return $role instanceof Role
            && $this->user()?->can('update', $role) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:50', Rule::unique('config__roles', 'name')->ignore($this->route('role'), 'ID')],
            'description' => ['sometimes', 'string', 'max:280'],
            'needs_subscriptions' => ['sometimes', 'boolean'],
            'may_create-update_items' => ['sometimes', 'boolean'],
            'may_delete_items' => ['sometimes', 'boolean'],
            'may_create-update-delete_system-items' => ['sometimes', 'boolean'],
            'may_use_tlp-red' => ['sometimes', 'boolean'],
            'may_access_unsubscribed-markets' => ['sometimes', 'boolean'],
        ];
    }
}
