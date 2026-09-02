<?php

namespace App\Http\Requests;

use App\Models\GameMilestone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGameMilestoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        $gameMilestone = $this->route('gameMilestone');

        return $gameMilestone instanceof GameMilestone
            && $this->user()?->can('update', $gameMilestone) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $gameMilestone = $this->route('gameMilestone');
        $milestoneId = $gameMilestone instanceof GameMilestone ? $gameMilestone->ID : null;
        $gameId = $this->input('game_ID', $gameMilestone instanceof GameMilestone ? $gameMilestone->game_ID : null);
        $statusId = $this->input('expected_status_ID', $gameMilestone instanceof GameMilestone ? $gameMilestone->expected_status_ID : null);

        return [
            'game_ID' => [
                'sometimes',
                'integer',
                'exists:games,ID',
                Rule::unique('game_milestones', 'game_ID')->where('expected_status_ID', $statusId)->ignore($milestoneId, 'ID'),
            ],
            'expected_status_ID' => [
                'sometimes',
                'integer',
                'exists:config__statuses,ID',
                Rule::unique('game_milestones', 'expected_status_ID')->where('game_ID', $gameId)->ignore($milestoneId, 'ID'),
            ],
            'expected_date' => ['sometimes', 'date'],
            'actual_date' => ['nullable', 'date'],
            'comment' => ['nullable', 'string', 'max:140'],
        ];
    }
}
