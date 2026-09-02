<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'version_ID',
    'jurisdiction_ID',
    'venue_ID',
    'first_install_date',
    'live',
    'test',
    'planned',
    'perf_rating',
    'tech_rating',
    'BI_URL',
    'video_URL',
    'first_install_type',
    'rtp',
    'test_comment',
    'planned_comment',
    'removal_comment',
    'removal_date',
])]
class Installation extends Model
{
    public const TECH_RATINGS = [
        'red',
        'yellow',
        'green',
    ];

    public const FIRST_INSTALL_TYPES = [
        'new',
        'conversion',
    ];

    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(function (Installation $installation): void {
            $installation->mod_date = now();
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
            'first_install_date' => 'date:Y-m-d',
            'removal_date' => 'date:Y-m-d',
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
     * @return BelongsTo<Venue, $this>
     */
    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class, 'venue_ID', 'ID');
    }
}
