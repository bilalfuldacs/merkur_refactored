<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'slug',
    'name',
    'year',
    'icon',
    'active',
    'sort_order',
    'created_at',
])]
class ScoutEvent extends Model
{
    protected $table = 'scout_events';

    protected $primaryKey = 'ID';

    public $timestamps = false;

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'year' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    /**
     * @return HasMany<ScoutAttendant, $this>
     */
    public function attendants(): HasMany
    {
        return $this->hasMany(ScoutAttendant::class, 'event_ID', 'ID');
    }

    public static function fromSlug(string $slug): ?self
    {
        $slug = strtolower(preg_replace('/[^a-z0-9]+/', '', $slug) ?? '');
        if ($slug === '') {
            return null;
        }

        return self::query()->where('slug', $slug)->first();
    }

    public static function default(): self
    {
        $event = self::query()->where('slug', 'ice2027')->first()
            ?? self::query()->orderBy('sort_order')->orderBy('ID')->first();

        if ($event === null) {
            $event = self::query()->create([
                'slug' => 'ice2027',
                'name' => 'ICE 2027',
                'year' => 2027,
                'icon' => 'fa-igloo',
                'active' => true,
                'sort_order' => 1,
                'created_at' => now(),
            ]);
        }

        return $event;
    }
}
