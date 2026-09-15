<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'event_ID',
    'user_ID',
    'may_manage',
])]
class ScoutAttendant extends Model
{
    protected $table = 'scout_attendants';

    protected $primaryKey = 'ID';

    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'may_manage' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<ScoutEvent, $this>
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(ScoutEvent::class, 'event_ID', 'ID');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_ID', 'ID');
    }
}
