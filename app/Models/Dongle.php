<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'version_ID',
    'name2',
    'jurisdiction_ID',
    'salesforce_URL',
])]
class Dongle extends Model
{
    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(function (Dongle $dongle): void {
            $dongle->mod_date = now();
        });

        static::deleting(function (Dongle $dongle): void {
            if ($dongle->softwareReleases()->exists()) {
                throw new \RuntimeException('Cannot delete a dongle that is still used as a base dongle for releases.');
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
     * @return BelongsTo<Version, $this>
     */
    public function version(): BelongsTo
    {
        return $this->belongsTo(Version::class, 'version_ID', 'ID');
    }

    /**
     * @return BelongsTo<Jurisdiction, $this>
     */
    public function jurisdiction(): BelongsTo
    {
        return $this->belongsTo(Jurisdiction::class, 'jurisdiction_ID', 'ID');
    }

    /**
     * @return HasMany<SoftwareRelease, $this>
     */
    public function softwareReleases(): HasMany
    {
        return $this->hasMany(SoftwareRelease::class, 'base_dongle_ID', 'ID');
    }
}
