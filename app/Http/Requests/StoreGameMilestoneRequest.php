<?php

namespace App\Http\Requests;

use App\Models\GameMilestone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGameMilestoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', GameMilestone::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'game_ID' => [
                'required',
                'integer',
                'exists:games,ID',
                Rule::unique('game_milestones', 'game_ID')->where('expected_status_ID', $this->input('expected_status_ID')),
            ],
            'expected_status_ID' => ['required', 'integer', 'exists:config__statuses,ID'],
            'expected_date' => ['required', 'date'],
            'actual_date' => ['nullable', 'date'],
            'comment' => ['nullable', 'string', 'max:140'],
        ];
    }
}
