<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'team_ID',
    'user_ID',
])]
class Ice2027TeamMember extends Model
{
    protected $table = 'ice2027_team_members';

    protected $primaryKey = 'ID';

    public $timestamps = false;

    public function getRouteKeyName(): string
    {
        return 'ID';
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
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_ID', 'ID');
    }
}
