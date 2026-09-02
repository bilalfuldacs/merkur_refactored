<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'competitor_ID',
    'name',
    'game_type',
    'created_by',
    'created_at',
])]
class Ice2027Game extends Model
{
    protected $table = 'ice2027_games';

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
     * @return BelongsTo<Ice2027Competitor, $this>
     */
    public function competitor(): BelongsTo
    {
        return $this->belongsTo(Ice2027Competitor::class, 'competitor_ID', 'ID');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'ID');
    }
}
