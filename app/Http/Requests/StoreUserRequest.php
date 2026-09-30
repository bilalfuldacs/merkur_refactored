<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', User::class) === true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'initials' => ['required', 'string', 'size:3', 'unique:dynamic__users,initials'],
            'active' => ['required', 'boolean'],
            'lastname' => ['required', 'string', 'max:30'],
            'firstname' => ['required', 'string', 'max:30'],
            'prefix' => ['nullable', 'string', 'max:15'],
            'username' => ['required', 'string', 'max:50', 'unique:dynamic__users,username'],
            'password' => ['required', 'string', 'min:8'],
            'bcolor' => ['nullable', 'string', 'size:7'],
            'color' => ['nullable', 'string', 'size:7'],
            'role_ID' => ['required', 'integer', 'exists:config__roles,ID'],
            'beta' => ['required', 'boolean'],
            'jobtitle' => ['required', 'string', 'max:140'],
            'birthday' => ['nullable', 'date'],
            'decolorize_avatars' => ['sometimes', 'boolean'],
            'appearance' => ['sometimes', 'in:auto,light,dark'],
            'notifications' => ['sometimes', 'in:off,daily,weekly'],
            'iceattendent2027' => ['sometimes', 'boolean'],
        ];
    }
}
