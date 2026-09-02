<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'studio_ID',
    '3rd_party',
    'variant_of_concept_ID',
    'theme',
    'portfolio_strategy',
    'pry_design_target_mkt',
    'base_game_USP',
    'feature_game_USP',
    'IP_licensed',
    'trademarked_EU',
    'trademarked_UK',
    'trademarked_US',
    'trademarked_CA',
    'trademarked_AU-NZ',
])]
class GameConcept extends Model
{
    public const PORTFOLIO_STRATEGIES = [
        'Competitive Response',
        'Evolution of Proprietary Game',
        'New',
        'Cross Leveraging Success',
    ];

    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::deleting(function (GameConcept $concept): void {
            if ($concept->games()->exists()) {
                throw new \RuntimeException('Cannot delete a game concept that still has games.');
            }

            if ($concept->variants()->exists()) {
                throw new \RuntimeException('Cannot delete a game concept that still has variants.');
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'ID';
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'mod_date' => 'datetime',
            'IP_licensed' => 'boolean',
            'trademarked_EU' => 'boolean',
            'trademarked_UK' => 'boolean',
            'trademarked_US' => 'boolean',
            'trademarked_CA' => 'boolean',
            'trademarked_AU-NZ' => 'boolean',
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
     * @return BelongsTo<Team, $this>
     */
    public function studio(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'studio_ID', 'ID');
    }

    /**
     * @return BelongsTo<Team, $this>
     */
    public function thirdParty(): BelongsTo
    {
        return $this->belongsTo(Team::class, '3rd_party', 'ID');
    }

    /**
     * @return BelongsTo<GameConcept, $this>
     */
    public function variantOf(): BelongsTo
    {
        return $this->belongsTo(self::class, 'variant_of_concept_ID', 'ID');
    }

    /**
     * @return HasMany<GameConcept, $this>
     */
    public function variants(): HasMany
    {
        return $this->hasMany(self::class, 'variant_of_concept_ID', 'ID');
    }

    /**
     * @return BelongsTo<Jurisdiction, $this>
     */
    public function primaryDesignTargetMarket(): BelongsTo
    {
        return $this->belongsTo(Jurisdiction::class, 'pry_design_target_mkt', 'ID');
    }

    /**
     * @return HasMany<Game, $this>
     */
    public function games(): HasMany
    {
        return $this->hasMany(Game::class, 'concept_ID', 'ID');
    }
}
