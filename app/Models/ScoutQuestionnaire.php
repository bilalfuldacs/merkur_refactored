<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'event_ID',
    'team_ID',
    'competitor_ID',
    'payload',
    'updated_by',
    'updated_at',
])]
class ScoutQuestionnaire extends Model
{
    protected $table = 'scout_questionnaires';

    protected $primaryKey = 'ID';

    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'updated_at' => 'datetime',
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
     * @return BelongsTo<Ice2027Team, $this>
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Ice2027Team::class, 'team_ID', 'ID');
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
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by', 'ID');
    }

    /**
     * @return HasMany<ScoutQuestionnaireHistory, $this>
     */
    public function history(): HasMany
    {
        return $this->hasMany(ScoutQuestionnaireHistory::class, 'questionnaire_ID', 'ID');
    }
}
