<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'note',
    'post_ID',
    'parent_ID',
])]
class DynamicComment extends Model
{
    protected $table = 'dynamic__comments';

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

    /**
     * @return BelongsTo<DynamicComment, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_ID', 'ID');
    }

    /**
     * @return HasMany<DynamicComment, $this>
     */
    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'parent_ID', 'ID');
    }
}
