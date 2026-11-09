<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'title',
    'description',
    'year',
    'quarter',
    'status',
    'is_hidden',
    'sort_order',
    'created_by',
    'mod_by',
    'mod_date',
])]
class SihRoadmapMilestone extends Model
{
    public const STATUSES = ['planned', 'active', 'done'];

    protected $table = 'sih_roadmap_milestones';

    protected $primaryKey = 'ID';

    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'quarter' => 'integer',
            'is_hidden' => 'boolean',
            'sort_order' => 'integer',
            'mod_date' => 'datetime',
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
     * @return BelongsTo<User, $this>
     */
    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mod_by', 'ID');
    }

    /**
     * @return HasMany<SihRoadmapLink, $this>
     */
    public function links(): HasMany
    {
        return $this->hasMany(SihRoadmapLink::class, 'milestone_ID', 'ID')->orderBy('sort_order')->orderBy('ID');
    }

    /**
     * @return HasMany<SihRoadmapComment, $this>
     */
    public function comments(): HasMany
    {
        return $this->hasMany(SihRoadmapComment::class, 'milestone_ID', 'ID')->orderBy('ID');
    }

    /**
     * @return HasMany<SihRoadmapAttachment, $this>
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(SihRoadmapAttachment::class, 'milestone_ID', 'ID')->orderBy('ID');
    }
}
