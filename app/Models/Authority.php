<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'website',
])]
class Authority extends Model
{
    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::deleting(function (Authority $authority): void {
            if ($authority->jurisdictions()->exists()) {
                throw new \RuntimeException('Cannot delete an authority that still has jurisdictions.');
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
     * @return HasMany<Jurisdiction, $this>
     */
    public function jurisdictions(): HasMany
    {
        return $this->hasMany(Jurisdiction::class, 'authority_ID', 'ID');
    }
}
