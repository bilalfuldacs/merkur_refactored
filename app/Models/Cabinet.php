<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'name',
    'code',
    'form_factor',
    'tagline',
    'blurb',
])]
class Cabinet extends Model
{
    protected $primaryKey = 'ID';

    public $timestamps = false;

    public const FORM_FACTORS = [
        'Slant',
        'Upright',
    ];

    protected static function booted(): void
    {
        static::creating(function (Cabinet $cabinet): void {
            $cabinet->mod_date = now();
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
}
