<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'version_ID',
    'jurisdiction_ID',
    'start_date',
    'video_URL',
    'test_comment',
    'ramifications',
])]
class FocusGroup extends Model
{
    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(function (FocusGroup $focusGroup): void {
            $focusGroup->mod_date = now();
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
            'start_date' => 'date:Y-m-d',
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
}
