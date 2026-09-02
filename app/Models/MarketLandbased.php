<?php

namespace App\Models;

use App\Models\Concerns\VisibleToMarketSubscriber;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'jurisdiction_ID',
    'jurisdiction_segment',
    'cluster',
    'metadata',
    'total_#_of_venues',
    'total_#_of_EGMs',
    '#_of_MERKUR_EGMs',
    'total_market_revenue',
    'share_growth',
    'ASP_per_machine',
    'replacement_rate',
    'openness_to_switch',
    'target_win_rate',
    'top_competitors',
    'SWOT_competitors',
    'top_games',
    'top_games_comment',
    'game_types',
    'game_types_comment',
    'volatility',
    'lines',
    'reel_grid',
    'bet_levels-denoms',
    'RTP',
    'progressive_jackpots',
    'bonus_features',
    'feature_triggers',
    'volatility_mode_selection',
    'adaptive_gameplay',
    'hit_frequency',
    'win_distribution',
    'bonus_frequency',
    'avg_bonus_win',
    'max_win',
    'pay_table_math',
    'prog_seed-contrib',
    'game_cycle',
    'hit_to_feature_ratio',
    'std_deviation',
    'top_cabinets',
    'core_games',
    'preferred_CG',
    'premium_games',
    'preferred_PG',
    'avg_selling_price',
    'revenue_share',
    'payback_period',
    'LTV',
    'PLR',
    'key_perf_metrics',
    'key_perf_metrics_comment',
    'demographic',
    'socioeconomic',
    'motivation',
    'behavior',
    'confidence',
    'cultural_pref',
    'opportunities',
    'seasonal_factors',
    'emerging_competitors',
    'cntry_reg_rules',
    'local_reg_rules',
    'immediate',
    'medium_term',
    'notes',
])]
class MarketLandbased extends Model
{
    use VisibleToMarketSubscriber;

    public const CLUSTERS = [
        'regular',
        'focal',
    ];

    public const SEGMENTS = [
        'land-based',
        'online',
        'online ⭐',
    ];

    protected $table = 'markets_landbased';

    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(function (MarketLandbased $market): void {
            $market->mod_date = now();
        });
    }

    public function getRouteKeyName(): string
    {
        return 'ID';
    }

    public function syncJurisdictionSegment(): void
    {
        $jurisdiction = $this->relationLoaded('jurisdiction')
            ? $this->jurisdiction
            : Jurisdiction::query()->find($this->jurisdiction_ID);

        if ($jurisdiction instanceof Jurisdiction) {
            $this->jurisdiction_segment = $jurisdiction->segment;
        }
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'mod_date' => 'datetime',
            'metadata' => 'array',
            'top_competitors' => 'array',
            'SWOT_competitors' => 'array',
            'top_games' => 'array',
            'game_types' => 'array',
            'top_cabinets' => 'array',
            'key_perf_metrics' => 'array',
            'volatility_mode_selection' => 'boolean',
            'share_growth' => 'decimal:1',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mod_by', 'ID');
    }

    /**
     * @return BelongsTo<Jurisdiction, $this>
     */
    public function jurisdiction(): BelongsTo
    {
        return $this->belongsTo(Jurisdiction::class, 'jurisdiction_ID', 'ID');
    }
}
