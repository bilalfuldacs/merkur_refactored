<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'event_ID',
    'name',
    'created_by',
    'created_at',
])]
class Ice2027Team extends Model
{
    protected $table = 'ice2027_teams';

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
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'ID');
    }

    /**
     * @return HasMany<Ice2027TeamMember, $this>
     */
    public function members(): HasMany
    {
        return $this->hasMany(Ice2027TeamMember::class, 'team_ID', 'ID');
    }

    /**
     * @return HasMany<Ice2027Competitor, $this>
     */
    public function competitors(): HasMany
    {
        return $this->hasMany(Ice2027Competitor::class, 'team_ID', 'ID');
    }
}
