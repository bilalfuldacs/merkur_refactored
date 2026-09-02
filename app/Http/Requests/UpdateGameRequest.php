<?php

namespace App\Http\Requests;

use App\Models\Game;
use App\Models\Version;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateGameRequest extends FormRequest
{
    public function authorize(): bool
    {
        $game = $this->route('game');

        return $game instanceof Game
            && $this->user()?->can('update', $game) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'concept_ID' => [
                'sometimes',
                'integer',
                'exists:game_concepts,ID',
                $this->uniqueConceptPlatformResolutionRule(),
            ],
            'platform_ID' => ['sometimes', 'integer', 'exists:platforms,ID'],
            'resolution_ID' => ['nullable', 'integer', 'exists:resolutions,ID'],
            'ID_text' => ['sometimes', 'string', 'max:30'],
            'pm_owner_ID' => ['nullable', 'integer', 'exists:dynamic__users,ID'],
            'video_URL' => ['nullable', 'string', 'max:250'],
            'notes' => ['nullable', 'string'],
            'version_from_ID' => ['nullable', 'integer', 'exists:versions,ID'],
            'status_ID' => ['nullable', 'integer', 'exists:config__statuses,ID'],
            'estimated_effort' => ['nullable', Rule::in(Game::ESTIMATED_EFFORTS)],
            'in_roadmap_g' => ['sometimes', 'boolean'],
            'gli11' => ['nullable', 'boolean'],
            'volatility' => ['nullable', 'string', 'max:10'],
            'lines' => ['nullable', 'string', 'max:40'],
            'reels' => ['nullable', 'string', 'max:40'],
            'max_bet' => ['nullable', 'string', 'max:15'],
            'rtps' => ['nullable', 'string', 'max:100'],
            'progressive_type' => ['nullable', Rule::in(Game::PROGRESSIVE_TYPES)],
            'cash_on_reels' => ['nullable', 'boolean'],
            'hold_and_spin' => ['nullable', 'boolean'],
            'num_PP_pots' => ['nullable', 'integer', 'min:0'],
            'true_persistence' => ['nullable', Rule::in(Game::TRUE_PERSISTENCE)],
            'feature_in_feature' => ['nullable', 'boolean'],
            'prob_of_highest_win' => ['nullable', 'string', 'max:200'],
            'top_award_base' => ['nullable', 'string', 'max:15'],
            'top_award_feature' => ['nullable', 'string', 'max:15'],
            'game_rules' => ['nullable', 'string'],
            'supports_signage' => ['nullable', 'boolean'],
            'engine' => ['nullable', Rule::in(Game::ENGINES)],
            'version_removed_ID' => ['nullable', 'integer', 'exists:versions,ID'],
            'dev_URL' => ['nullable', 'string', 'max:250'],
            'attributes' => ['nullable', 'array'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $game = $this->route('game');

            if (! $game instanceof Game) {
                return;
            }

            $platformId = $this->input('platform_ID', $game->platform_ID);
            $versionFromId = $this->exists('version_from_ID')
                ? $this->input('version_from_ID')
                : $game->version_from_ID;

            if ($versionFromId && $platformId && ! Version::query()
                ->where('ID', $versionFromId)
                ->where('platform_ID', $platformId)
                ->exists()) {
                $validator->errors()->add('version_from_ID', Game::VERSION_PLATFORM_MISMATCH);
            }
        });
    }

    private function uniqueConceptPlatformResolutionRule(): \Illuminate\Validation\Rules\Unique
    {
        $game = $this->route('game');

        return Rule::unique('games', 'concept_ID')
            ->where(function ($query) use ($game) {
                $query->where('platform_ID', $this->input('platform_ID', $game instanceof Game ? $game->platform_ID : null));

                $resolutionId = $this->exists('resolution_ID')
                    ? $this->input('resolution_ID')
                    : ($game instanceof Game ? $game->resolution_ID : null);

                if ($resolutionId === null) {
                    $query->whereNull('resolution_ID');
                } else {
                    $query->where('resolution_ID', $resolutionId);
                }
            })
            ->ignore($game instanceof Game ? $game->ID : null, 'ID');
    }
}
