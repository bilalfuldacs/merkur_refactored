<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'website',
    'active',
])]
class Partner extends Model
{
    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(function (Partner $partner): void {
            $partner->mod_date = now();
        });

        static::deleting(function (Partner $partner): void {
            if ($partner->venues()->exists()) {
                throw new \RuntimeException('Cannot delete a partner that still has venues.');
            }

            if ($partner->activities()->exists()) {
                throw new \RuntimeException('Cannot delete a partner that still has activities.');
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
     * @return HasMany<Venue, $this>
     */
    public function venues(): HasMany
    {
        return $this->hasMany(Venue::class, 'partner_ID', 'ID');
    }

    /**
     * @return HasMany<PartnerActivity, $this>
     */
    public function activities(): HasMany
    {
        return $this->hasMany(PartnerActivity::class, 'partner_ID', 'ID');
    }
}
