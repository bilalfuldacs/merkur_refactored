<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'person_ID',
    'jurisdiction_ID',
    'as_deputy',
])]
class StakeJurisdiction extends Model
{
    protected $table = 'stakes_jurisdictions';

    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(function (StakeJurisdiction $stake): void {
            $stake->mod_date = now();
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
            'as_deputy' => 'boolean',
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
    public function person(): BelongsTo
    {
        return $this->belongsTo(User::class, 'person_ID', 'ID');
    }

    /**
     * @return BelongsTo<Jurisdiction, $this>
     */
    public function jurisdiction(): BelongsTo
    {
        return $this->belongsTo(Jurisdiction::class, 'jurisdiction_ID', 'ID');
    }
}
