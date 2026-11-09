<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'milestone_ID',
    'original_name',
    'stored_name',
    'mime',
    'size',
    'mod_by',
    'mod_date',
])]
class SihRoadmapAttachment extends Model
{
    protected $table = 'sih_roadmap_attachments';

    protected $primaryKey = 'ID';

    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'mod_date' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<SihRoadmapMilestone, $this>
     */
    public function milestone(): BelongsTo
    {
        return $this->belongsTo(SihRoadmapMilestone::class, 'milestone_ID', 'ID');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mod_by', 'ID');
    }
}
