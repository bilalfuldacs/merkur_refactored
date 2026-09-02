<?php

namespace App\Http\Requests\Concerns;

use App\Models\Jurisdiction;
use App\Models\MarketLandbased;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

trait ValidatesMarketLandbasedPayload
{
    /**
     * @return array<string, mixed>
     */
    protected function payloadRules(): array
    {
        return [
            'cluster' => ['sometimes', Rule::in(MarketLandbased::CLUSTERS)],
            'metadata' => ['nullable', 'array'],
            'total_#_of_venues' => ['nullable', 'integer', 'min:0'],
            'total_#_of_EGMs' => ['nullable', 'integer', 'min:0'],
            '#_of_MERKUR_EGMs' => ['nullable', 'integer', 'min:0'],
            'total_market_revenue' => ['nullable', 'integer'],
            'share_growth' => ['nullable', 'numeric'],
            'ASP_per_machine' => ['nullable', 'string', 'max:50'],
            'replacement_rate' => ['nullable', 'string', 'max:50'],
            'openness_to_switch' => ['nullable', 'integer'],
            'target_win_rate' => ['nullable', 'integer'],
            'top_competitors' => ['nullable', 'array'],
            'SWOT_competitors' => ['nullable', 'array'],
            'top_games' => ['nullable', 'array'],
            'top_games_comment' => ['nullable', 'string'],
            'game_types' => ['nullable', 'array'],
            'game_types_comment' => ['nullable', 'string'],
            'volatility' => ['nullable', 'string', 'max:80'],
            'lines' => ['nullable', 'string', 'max:40'],
            'reel_grid' => ['nullable', 'string', 'max:40'],
            'bet_levels-denoms' => ['nullable', 'string', 'max:120'],
            'RTP' => ['nullable', 'string', 'max:80'],
            'progressive_jackpots' => ['nullable', 'string'],
            'bonus_features' => ['nullable', 'string'],
            'feature_triggers' => ['nullable', 'string'],
            'volatility_mode_selection' => ['nullable', 'boolean'],
            'adaptive_gameplay' => ['nullable', 'string', 'max:40'],
            'hit_frequency' => ['nullable', 'string', 'max:80'],
            'win_distribution' => ['nullable', 'string', 'max:80'],
            'bonus_frequency' => ['nullable', 'string', 'max:80'],
            'avg_bonus_win' => ['nullable', 'string', 'max:80'],
            'max_win' => ['nullable', 'string', 'max:80'],
            'pay_table_math' => ['nullable', 'string'],
            'prog_seed-contrib' => ['nullable', 'string', 'max:40'],
            'game_cycle' => ['nullable', 'string', 'max:80'],
            'hit_to_feature_ratio' => ['nullable', 'string', 'max:80'],
            'std_deviation' => ['nullable', 'string', 'max:80'],
            'top_cabinets' => ['nullable', 'array'],
            'core_games' => ['nullable', 'string', 'max:40'],
            'preferred_CG' => ['nullable', 'string', 'max:60'],
            'premium_games' => ['nullable', 'string', 'max:40'],
            'preferred_PG' => ['nullable', 'string', 'max:60'],
            'avg_selling_price' => ['nullable', 'string', 'max:40'],
            'revenue_share' => ['nullable', 'string', 'max:40'],
            'payback_period' => ['nullable', 'string', 'max:40'],
            'LTV' => ['nullable', 'string', 'max:40'],
            'PLR' => ['nullable', 'string', 'max:80'],
            'key_perf_metrics' => ['nullable', 'array'],
            'key_perf_metrics_comment' => ['nullable', 'string'],
            'demographic' => ['nullable', 'string'],
            'socioeconomic' => ['nullable', 'string'],
            'motivation' => ['nullable', 'string'],
            'behavior' => ['nullable', 'string'],
            'confidence' => ['nullable', 'string'],
            'cultural_pref' => ['nullable', 'string'],
            'opportunities' => ['nullable', 'string'],
            'seasonal_factors' => ['nullable', 'string'],
            'emerging_competitors' => ['nullable', 'string'],
            'cntry_reg_rules' => ['nullable', 'string'],
            'local_reg_rules' => ['nullable', 'string'],
            'immediate' => ['nullable', 'string'],
            'medium_term' => ['nullable', 'string'],
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

        if (! in_array($jurisdiction->segment, MarketLandbased::SEGMENTS, true)) {
            $validator->errors()->add(
                'jurisdiction_ID',
                'This jurisdiction segment cannot be used for a land-based market.'
            );
        }
    }
}
