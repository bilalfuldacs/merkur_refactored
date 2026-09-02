<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'build_ID',
    'expected_status_ID',
    'expected_date',
    'actual_date',
    'comment',
])]
class BuildMilestone extends Model
{
    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(function (BuildMilestone $milestone): void {
            $milestone->mod_date = now();
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
            'expected_date' => 'date:Y-m-d',
            'actual_date' => 'date:Y-m-d',
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
     * @return BelongsTo<Build, $this>
     */
    public function build(): BelongsTo
    {
        return $this->belongsTo(Build::class, 'build_ID', 'ID');
    }

    /**
     * @return BelongsTo<ConfigStatus, $this>
     */
    public function expectedStatus(): BelongsTo
    {
        return $this->belongsTo(ConfigStatus::class, 'expected_status_ID', 'ID');
    }
}
