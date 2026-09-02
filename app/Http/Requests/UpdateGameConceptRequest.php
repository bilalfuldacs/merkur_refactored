<?php

namespace App\Http\Requests;

use App\Models\GameConcept;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGameConceptRequest extends FormRequest
{
    public function authorize(): bool
    {
        $gameConcept = $this->route('gameConcept');

        return $gameConcept instanceof GameConcept
            && $this->user()?->can('update', $gameConcept) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $gameConcept = $this->route('gameConcept');
        $conceptId = $gameConcept instanceof GameConcept ? $gameConcept->ID : null;

        return [
            'name' => ['sometimes', 'string', 'max:50', Rule::unique('game_concepts', 'name')->ignore($conceptId, 'ID')],
            'studio_ID' => [
                'sometimes',
                'integer',
                Rule::exists('teams', 'ID')->where('type', 'Studio (Game Design)'),
            ],
            '3rd_party' => [
                'nullable',
                'integer',
                Rule::exists('teams', 'ID')->where('type', '3rd Party'),
            ],
            'variant_of_concept_ID' => [
                'nullable',
                'integer',
                'exists:game_concepts,ID',
                Rule::notIn([$conceptId]),
            ],
            'theme' => ['nullable', 'string', 'max:40'],
            'portfolio_strategy' => ['nullable', Rule::in(GameConcept::PORTFOLIO_STRATEGIES)],
            'pry_design_target_mkt' => ['nullable', 'integer', 'exists:jurisdictions,ID'],
            'base_game_USP' => ['nullable', 'string'],
            'feature_game_USP' => ['nullable', 'string'],
            'IP_licensed' => ['nullable', 'boolean'],
            'trademarked_EU' => ['nullable', 'boolean'],
            'trademarked_UK' => ['nullable', 'boolean'],
            'trademarked_US' => ['nullable', 'boolean'],
            'trademarked_CA' => ['nullable', 'boolean'],
            'trademarked_AU-NZ' => ['nullable', 'boolean'],
        ];
    }
}
