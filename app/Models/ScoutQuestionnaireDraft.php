<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'event_ID',
    'team_ID',
    'competitor_ID',
    'draft_key',
    'payload',
    'ratings',
    'updated_by',
    'updated_at',
])]
class ScoutQuestionnaireDraft extends Model
{
    protected $table = 'scout_questionnaire_drafts';

    protected $primaryKey = 'ID';

    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'ratings' => 'array',
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
}
