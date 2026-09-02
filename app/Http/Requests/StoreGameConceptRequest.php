<?php

namespace App\Http\Requests;

use App\Models\GameConcept;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGameConceptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', GameConcept::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:50', 'unique:game_concepts,name'],
            'studio_ID' => [
                'required',
                'integer',
                Rule::exists('teams', 'ID')->where('type', 'Studio (Game Design)'),
            ],
            '3rd_party' => [
                'nullable',
                'integer',
                Rule::exists('teams', 'ID')->where('type', '3rd Party'),
            ],
            'variant_of_concept_ID' => ['nullable', 'integer', 'exists:game_concepts,ID'],
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
