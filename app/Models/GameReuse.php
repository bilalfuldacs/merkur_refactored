<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'original_game_port_ID',
    'version_from_ID',
    'version_removed_ID',
])]
class GameReuse extends Model
{
    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(function (GameReuse $reuse): void {
            $reuse->mod_date = now();
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
     * @return BelongsTo<Game, $this>
     */
    public function originalGame(): BelongsTo
    {
        return $this->belongsTo(Game::class, 'original_game_port_ID', 'ID');
    }

    /**
     * @return BelongsTo<Version, $this>
     */
    public function versionFrom(): BelongsTo
    {
        return $this->belongsTo(Version::class, 'version_from_ID', 'ID');
    }

    /**
     * @return BelongsTo<Version, $this>
     */
    public function versionRemoved(): BelongsTo
    {
        return $this->belongsTo(Version::class, 'version_removed_ID', 'ID');
    }
}
