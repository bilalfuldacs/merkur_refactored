<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'mod_by',
    'post_ID',
    'active',
])]
class DynamicBookmark extends Model
{
    protected $table = 'dynamic__bookmarks';

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
            'mod_date' => 'datetime',
            'active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mod_by', 'ID');
    }

    /**
     * @return BelongsTo<DynamicPost, $this>
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(DynamicPost::class, 'post_ID', 'ID');
    }
}
