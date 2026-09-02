<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'concept_ID',
    'platform_ID',
    'resolution_ID',
    'ID_text',
    'pm_owner_ID',
    'video_URL',
    'notes',
    'version_from_ID',
    'status_ID',
    'estimated_effort',
    'in_roadmap_g',
    'gli11',
    'volatility',
    'lines',
    'reels',
    'max_bet',
    'rtps',
    'progressive_type',
    'cash_on_reels',
    'hold_and_spin',
    'num_PP_pots',
    'true_persistence',
    'feature_in_feature',
    'prob_of_highest_win',
    'top_award_base',
    'top_award_feature',
    'game_rules',
    'supports_signage',
    'engine',
    'version_removed_ID',
    'dev_URL',
    'attributes',
])]
class Game extends Model
{
    public const ESTIMATED_EFFORTS = [
        'low <2500h',
        'medium ≥2500h <5000h',
        'high ≥5000h <7500h',
        'very high ≥7500h',
    ];

    public const PROGRESSIVE_TYPES = [
        'Symbol Driven',
        'Mystery',
        'Symbol Driven & Mystery',
        'N/A',
    ];

    public const TRUE_PERSISTENCE = [
        'none',
        '<10',
        '10…49',
        '≥50',
    ];

    public const ENGINES = [
        'proprietary',
        'Godot',
        'Unity',
    ];

    public const VERSION_PLATFORM_MISMATCH = 'You chose the wrong version. This version was built for a different platform than the one selected for this game, so they do not match.';

    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::deleting(function (Game $game): void {
            if ($game->reuses()->exists()) {
                throw new \RuntimeException('Cannot delete a game that still has reuses.');
            }

            if ($game->defects()->exists()) {
                throw new \RuntimeException('Cannot delete a game that still has defects.');
            }

            if ($game->milestones()->exists()) {
                throw new \RuntimeException('Cannot delete a game that still has milestones.');
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
            'in_roadmap_g' => 'boolean',
            'gli11' => 'boolean',
            'cash_on_reels' => 'boolean',
            'hold_and_spin' => 'boolean',
            'feature_in_feature' => 'boolean',
            'supports_signage' => 'boolean',
            'attributes' => 'array',
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
     * @return BelongsTo<GameConcept, $this>
     */
    public function concept(): BelongsTo
    {
        return $this->belongsTo(GameConcept::class, 'concept_ID', 'ID');
    }

    /**
     * @return BelongsTo<Platform, $this>
     */
    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class, 'platform_ID', 'ID');
    }

    /**
     * @return BelongsTo<Resolution, $this>
     */
    public function resolution(): BelongsTo
    {
        return $this->belongsTo(Resolution::class, 'resolution_ID', 'ID');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function productOwner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pm_owner_ID', 'ID');
    }

    /**
     * @return BelongsTo<Version, $this>
     */
    public function versionFrom(): BelongsTo
    {
        return $this->belongsTo(Version::class, 'version_from_ID', 'ID');
    }

    /**
     * @return BelongsTo<Version, $this>
     */
    public function versionRemoved(): BelongsTo
    {
        return $this->belongsTo(Version::class, 'version_removed_ID', 'ID');
    }

    /**
     * @return BelongsTo<ConfigStatus, $this>
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(ConfigStatus::class, 'status_ID', 'ID');
    }

    /**
     * @return HasMany<GameReuse, $this>
     */
    public function reuses(): HasMany
    {
        return $this->hasMany(GameReuse::class, 'original_game_port_ID', 'ID');
    }

    /**
     * @return HasMany<Defect, $this>
     */
    public function defects(): HasMany
    {
        return $this->hasMany(Defect::class, 'game_ID', 'ID');
    }

    /**
     * @return HasMany<GameMilestone, $this>
     */
    public function milestones(): HasMany
    {
        return $this->hasMany(GameMilestone::class, 'game_ID', 'ID');
    }
}
