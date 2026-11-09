<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'milestone_ID',
    'label',
    'url',
    'sort_order',
])]
class SihRoadmapLink extends Model
{
    protected $table = 'sih_roadmap_links';

    protected $primaryKey = 'ID';

    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<SihRoadmapMilestone, $this>
     */
    public function milestone(): BelongsTo
    {
        return $this->belongsTo(SihRoadmapMilestone::class, 'milestone_ID', 'ID');
    }
}
