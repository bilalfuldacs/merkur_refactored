<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'color',
    'type',
    'website',
    'primary_contact_ID',
])]
class Team extends Model
{
    public const TYPES = [
        'Product Organization',
        'Studio (Game Design)',
        '3rd Party',
    ];

    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::deleting(function (Team $team): void {
            if ($team->gameConcepts()->exists()) {
                throw new \RuntimeException('Cannot delete a team that still has game concepts.');
            }

            if ($team->thirdPartyGameConcepts()->exists()) {
                throw new \RuntimeException('Cannot delete a team that is still used as a 3rd party on game concepts.');
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
     * @return BelongsTo<User, $this>
     */
    public function primaryContact(): BelongsTo
    {
        return $this->belongsTo(User::class, 'primary_contact_ID', 'ID');
    }

    /**
     * @return HasMany<GameConcept, $this>
     */
    public function gameConcepts(): HasMany
    {
        return $this->hasMany(GameConcept::class, 'studio_ID', 'ID');
    }

    /**
     * @return HasMany<GameConcept, $this>
     */
    public function thirdPartyGameConcepts(): HasMany
    {
        return $this->hasMany(GameConcept::class, '3rd_party', 'ID');
    }
}
