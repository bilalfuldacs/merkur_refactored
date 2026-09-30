<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'event_ID',
    'name',
    'team_ID',
    'hidden',
    'created_by',
    'created_at',
])]
class Ice2027Competitor extends Model
{
    protected $table = 'ice2027_competitors';

    protected $primaryKey = 'ID';

    public $timestamps = false;

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
            'created_at' => 'datetime',
            'hidden' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Ice2027Team, $this>
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Ice2027Team::class, 'team_ID', 'ID');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'ID');
    }

    /**
     * @return HasMany<Ice2027Game, $this>
     */
    public function games(): HasMany
    {
        return $this->hasMany(Ice2027Game::class, 'competitor_ID', 'ID');
    }

    /**
     * @return HasMany<Ice2027Questionnaire, $this>
     */
    public function questionnaires(): HasMany
    {
        return $this->hasMany(Ice2027Questionnaire::class, 'competitor_ID', 'ID');
    }
}
