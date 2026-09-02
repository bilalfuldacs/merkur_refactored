<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'SKU',
    'name',
    'type_ID',
])]
class Component extends Model
{
    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(function (Component $component): void {
            $component->mod_date = now();
        });

        static::deleting(function (Component $component): void {
            if ($component->compatibilities()->exists()) {
                throw new \RuntimeException('Cannot delete a component that still has compatibilities.');
            }
        });
    }

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
     * @return BelongsTo<HardwareType, $this>
     */
    public function type(): BelongsTo
    {
        return $this->belongsTo(HardwareType::class, 'type_ID', 'ID');
    }

    /**
     * @return HasMany<Compatibility, $this>
     */
    public function compatibilities(): HasMany
    {
        return $this->hasMany(Compatibility::class, 'component_ID', 'ID');
    }
}
