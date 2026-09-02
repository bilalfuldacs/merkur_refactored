<?php

namespace App\Http\Requests\Concerns;

use App\Models\Jurisdiction;
use App\Models\MarketOnline;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

trait ValidatesMarketOnlinePayload
{
    /**
     * @return array<string, mixed>
     */
    protected function payloadRules(): array
    {
        return [
            'cluster' => ['sometimes', Rule::in(MarketOnline::CLUSTERS)],
            'product_share' => ['nullable', 'string', 'max:15'],
            'product_share_merkur' => ['nullable', 'string', 'max:15'],
            'product_share_by_supplier' => ['nullable', 'string'],
            'segment_split' => ['nullable', 'string', 'max:80'],
            'game_feature_types' => ['nullable', 'string', 'max:80'],
            'fruits' => ['nullable', 'boolean'],
            'gems' => ['nullable', 'boolean'],
            'bars_and_7s' => ['nullable', 'boolean'],
            'space' => ['nullable', 'boolean'],
            'asia' => ['nullable', 'boolean'],
            'egypt' => ['nullable', 'boolean'],
            'nature_and_animals' => ['nullable', 'boolean'],
            'adventure' => ['nullable', 'boolean'],
            'history' => ['nullable', 'boolean'],
            'fantasy_and_mythology' => ['nullable', 'boolean'],
            'seasonally_themed' => ['nullable', 'string', 'max:80'],
            'volatility' => ['nullable', 'string', 'max:80'],
            'lines' => ['nullable', 'string', 'max:80'],
            'denominations' => ['nullable', 'string', 'max:80'],
            'sound' => ['nullable', 'string', 'max:80'],
            'smartphone' => ['nullable', 'boolean'],
            'tablet' => ['nullable', 'boolean'],
            'notebook' => ['nullable', 'boolean'],
            'desktop' => ['nullable', 'boolean'],
            'tech_requirements' => ['nullable', 'string', 'max:80'],
            'age_groups' => ['nullable', 'string', 'max:15'],
            'sex' => ['nullable', 'string', 'max:7'],
            'budget' => ['nullable', 'string', 'max:21'],
            'spending_segments' => ['nullable', 'string', 'max:11'],
            'main_competitors_and_top_3_games' => ['nullable', 'string'],
            'avg_bet' => ['nullable', 'numeric', 'min:0'],
            'avg_bet_merkur' => ['nullable', 'numeric', 'min:0'],
            'top_10_games' => ['nullable', 'string'],
            'bottom_10_games' => ['nullable', 'string'],
            'new_games' => ['nullable', 'string'],
            'lp_all' => ['nullable', 'string'],
            'lp_merkur' => ['nullable', 'string'],
            'sp_all' => ['nullable', 'string'],
            'sp_merkur' => ['nullable', 'string'],
            'rg_all' => ['nullable', 'string'],
            'rg_merkur' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ];
    }

    protected function validateJurisdictionSegment(Validator $validator, ?int $jurisdictionId): void
    {
        if ($jurisdictionId === null) {
            return;
        }

        $jurisdiction = Jurisdiction::query()->find($jurisdictionId);

        if (! $jurisdiction instanceof Jurisdiction) {
            return;
        }

        if (! in_array($jurisdiction->segment, MarketOnline::SEGMENTS, true)) {
            $validator->errors()->add(
                'jurisdiction_ID',
                'This jurisdiction segment cannot be used for an online market.'
            );
        }
    }
}
