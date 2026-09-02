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
    'product_share',
    'product_share_merkur',
    'product_share_by_supplier',
    'segment_split',
    'game_feature_types',
    'fruits',
    'gems',
    'bars_and_7s',
    'space',
    'asia',
    'egypt',
    'nature_and_animals',
    'adventure',
    'history',
    'fantasy_and_mythology',
    'seasonally_themed',
    'volatility',
    'lines',
    'denominations',
    'sound',
    'smartphone',
    'tablet',
    'notebook',
    'desktop',
    'tech_requirements',
    'age_groups',
    'sex',
    'budget',
    'spending_segments',
    'main_competitors_and_top_3_games',
    'avg_bet',
    'avg_bet_merkur',
    'top_10_games',
    'bottom_10_games',
    'new_games',
    'lp_all',
    'lp_merkur',
    'sp_all',
    'sp_merkur',
    'rg_all',
    'rg_merkur',
    'notes',
])]
class MarketOnline extends Model
{
    use VisibleToMarketSubscriber;

    public const CLUSTERS = [
        'regular',
        'focal',
    ];

    public const SEGMENTS = [
        'land-based',
        'online',
    ];

    protected $table = 'markets_online';

    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(function (MarketOnline $market): void {
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
            'fruits' => 'boolean',
            'gems' => 'boolean',
            'bars_and_7s' => 'boolean',
            'space' => 'boolean',
            'asia' => 'boolean',
            'egypt' => 'boolean',
            'nature_and_animals' => 'boolean',
            'adventure' => 'boolean',
            'history' => 'boolean',
            'fantasy_and_mythology' => 'boolean',
            'smartphone' => 'boolean',
            'tablet' => 'boolean',
            'notebook' => 'boolean',
            'desktop' => 'boolean',
            'avg_bet' => 'decimal:2',
            'avg_bet_merkur' => 'decimal:2',
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
