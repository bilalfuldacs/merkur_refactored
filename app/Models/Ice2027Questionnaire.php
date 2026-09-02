<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_ID',
    'competitor_ID',
    'payload',
    'submitted_at',
])]
class Ice2027Questionnaire extends Model
{
    protected $table = 'ice2027_questionnaires';

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
            'payload' => 'array',
            'submitted_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_ID', 'ID');
    }

    /**
     * @return BelongsTo<Ice2027Competitor, $this>
     */
    public function competitor(): BelongsTo
    {
        return $this->belongsTo(Ice2027Competitor::class, 'competitor_ID', 'ID');
    }
}
