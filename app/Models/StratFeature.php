<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'variant_of_ID',
    'description',
])]
class StratFeature extends Model
{
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
     * @return BelongsTo<StratFeature, $this>
     */
    public function variantOf(): BelongsTo
    {
        return $this->belongsTo(self::class, 'variant_of_ID', 'ID');
    }

    /**
     * @return HasMany<StratFeature, $this>
     */
    public function variants(): HasMany
    {
        return $this->hasMany(self::class, 'variant_of_ID', 'ID');
    }
}
