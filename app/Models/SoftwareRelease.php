<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'build_ID',
    'release_date',
    'release_by',
    'GLI_approval_status',
    'base_dongle_ID',
    'suitable_for_cabinets',
    'suitable_for_markets',
    'solved_issues',
    'notes',
])]
class SoftwareRelease extends Model
{
    protected $table = 'releases';

    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(function (SoftwareRelease $release): void {
            $release->mod_date = now();
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
            'release_date' => 'date:Y-m-d',
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
     * @return BelongsTo<User, $this>
     */
    public function releasedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'release_by', 'ID');
    }

    /**
     * @return BelongsTo<Build, $this>
     */
    public function build(): BelongsTo
    {
        return $this->belongsTo(Build::class, 'build_ID', 'ID');
    }

    /**
     * @return BelongsTo<Dongle, $this>
     */
    public function baseDongle(): BelongsTo
    {
        return $this->belongsTo(Dongle::class, 'base_dongle_ID', 'ID');
    }
}
