<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'orientation',
])]
class Resolution extends Model
{
    public const ORIENTATIONS = ['landscape', 'portrait'];

    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::deleting(function (Resolution $resolution): void {
            if ($resolution->games()->exists()) {
                throw new \RuntimeException('Cannot delete a resolution that is still used by games.');
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'ID';
    }

    /**
     * @return HasMany<Game, $this>
     */
    public function games(): HasMany
    {
        return $this->hasMany(Game::class, 'resolution_ID', 'ID');
    }
}
