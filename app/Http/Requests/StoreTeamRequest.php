<?php

namespace App\Http\Requests;

use App\Models\Team;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTeamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Team::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:40',
                Rule::unique('teams', 'name')->where('type', $this->input('type')),
            ],
            'type' => ['required', Rule::in(Team::TYPES)],
            'color' => ['nullable', 'string', 'size:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'website' => ['nullable', 'string', 'max:40'],
            'primary_contact_ID' => ['nullable', 'integer', 'exists:dynamic__users,ID'],
        ];
    }
}
