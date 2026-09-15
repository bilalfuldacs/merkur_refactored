<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'questionnaire_ID',
    'user_ID',
    'payload',
    'saved_at',
])]
class ScoutQuestionnaireHistory extends Model
{
    protected $table = 'scout_questionnaire_history';

    protected $primaryKey = 'ID';

    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'saved_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<ScoutQuestionnaire, $this>
     */
    public function questionnaire(): BelongsTo
    {
        return $this->belongsTo(ScoutQuestionnaire::class, 'questionnaire_ID', 'ID');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_ID', 'ID');
    }
}
