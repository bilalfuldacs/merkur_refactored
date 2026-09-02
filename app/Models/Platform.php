<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'color',
    'tint_roadmap',
])]
class Platform extends Model
{
    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::deleting(function (Platform $platform): void {
            if ($platform->games()->exists()) {
                throw new \RuntimeException('Cannot delete a platform that still has games.');
            }

            if ($platform->versions()->exists()) {
                throw new \RuntimeException('Cannot delete a platform that still has versions.');
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
            'tint_roadmap' => 'boolean',
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
     * @return HasMany<Version, $this>
     */
    public function versions(): HasMany
    {
        return $this->hasMany(Version::class, 'platform_ID', 'ID');
    }

    /**
     * @return HasMany<Game, $this>
     */
    public function games(): HasMany
    {
        return $this->hasMany(Game::class, 'platform_ID', 'ID');
    }
}
