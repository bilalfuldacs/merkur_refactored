<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'varchar_40_NOT_NULL',
    'varchar_100',
    'link_TLP:RED',
    'geo_link',
    'text_with_#_in_its_name',
    'boolean',
    'integer',
    'decimal_10,_2',
    'float',
    'color',
    'traffic_light',
    'status_indicator',
    'date',
    'matrix',
    'enum',
    'foreign_key_ID',
    'foreign_key_go_ID',
    'another_test_item_ID',
    'attributes',
])]
class DevTest extends Model
{
    protected $table = 'test';

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
            'boolean' => 'boolean',
            'date' => 'date',
            'decimal_10,_2' => 'decimal:2',
            'attributes' => 'array',
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
     * @return BelongsTo<Platform, $this>
     */
    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class, 'foreign_key_ID', 'ID');
    }

    /**
     * @return BelongsTo<DevTest, $this>
     */
    public function parentItem(): BelongsTo
    {
        return $this->belongsTo(self::class, 'another_test_item_ID', 'ID');
    }

    /**
     * @return HasMany<DevTest, $this>
     */
    public function childItems(): HasMany
    {
        return $this->hasMany(self::class, 'another_test_item_ID', 'ID');
    }

    /**
     * @return HasMany<TestGameMap, $this>
     */
    public function gameMaps(): HasMany
    {
        return $this->hasMany(TestGameMap::class, 'test_ID', 'ID');
    }
}
