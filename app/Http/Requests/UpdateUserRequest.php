<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $userToUpdate = $this->route('user');

        return $userToUpdate instanceof User
            && $this->user()?->can('update', $userToUpdate) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $userId = $this->route('user')?->getKey();

        return [
            'initials' => ['sometimes', 'string', 'size:3', Rule::unique('dynamic__users', 'initials')->ignore($userId, 'ID')],
            'active' => ['sometimes', 'boolean'],
            'lastname' => ['sometimes', 'string', 'max:30'],
            'firstname' => ['sometimes', 'string', 'max:30'],
            'prefix' => ['nullable', 'string', 'max:15'],
            'username' => ['sometimes', 'string', 'max:50', Rule::unique('dynamic__users', 'username')->ignore($userId, 'ID')],
            'password' => ['sometimes', 'string', 'min:8'],
            'bcolor' => ['nullable', 'string', 'size:7'],
            'color' => ['nullable', 'string', 'size:7'],
            'role_ID' => ['sometimes', 'integer', 'exists:config__roles,ID'],
            'beta' => ['sometimes', 'boolean'],
            'jobtitle' => ['sometimes', 'string', 'max:140'],
            'birthday' => ['nullable', 'date'],
            'decolorize_avatars' => ['sometimes', 'boolean'],
            'appearance' => ['sometimes', 'in:auto,light,dark'],
            'notifications' => ['sometimes', 'in:off,daily,weekly'],
            'iceattendent2027' => ['sometimes', 'boolean'],
        ];
    }
}
