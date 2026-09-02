<?php

namespace App\Http\Requests;

use App\Models\Team;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTeamRequest extends FormRequest
{
    public function authorize(): bool
    {
        $team = $this->route('team');

        return $team instanceof Team
            && $this->user()?->can('update', $team) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $team = $this->route('team');
        $teamId = $team instanceof Team ? $team->ID : null;
        $type = $this->input('type', $team instanceof Team ? $team->type : null);

        return [
            'name' => [
                'sometimes',
                'string',
                'max:40',
                Rule::unique('teams', 'name')->where('type', $type)->ignore($teamId, 'ID'),
            ],
            'type' => ['sometimes', Rule::in(Team::TYPES)],
            'color' => ['nullable', 'string', 'size:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'website' => ['nullable', 'string', 'max:40'],
            'primary_contact_ID' => ['nullable', 'integer', 'exists:dynamic__users,ID'],
        ];
    }
}
