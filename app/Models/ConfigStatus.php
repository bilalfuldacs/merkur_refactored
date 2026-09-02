<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'ID',
    'name',
    'color',
    'text_color',
])]
class ConfigStatus extends Model
{
    protected $table = 'config__statuses';

    protected $primaryKey = 'ID';

    public $incrementing = false;

    public $timestamps = false;

    protected static function booted(): void
    {
        static::deleting(function (ConfigStatus $status): void {
            if (
                $status->games()->exists()
                || $status->versions()->exists()
                || $status->builds()->exists()
                || $status->versionMilestones()->exists()
                || $status->buildMilestones()->exists()
                || $status->gameMilestones()->exists()
            ) {
                throw new \RuntimeException('Cannot delete a status that is still used by other records.');
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'ID';
    }

    /**
     * @return HasMany<Game, $this>
     */
    public function games(): HasMany
    {
        return $this->hasMany(Game::class, 'status_ID', 'ID');
    }

    /**
     * @return HasMany<Version, $this>
     */
    public function versions(): HasMany
    {
        return $this->hasMany(Version::class, 'status_ID', 'ID');
    }

    /**
     * @return HasMany<Build, $this>
     */
    public function builds(): HasMany
    {
        return $this->hasMany(Build::class, 'status_ID', 'ID');
    }

    /**
     * @return HasMany<VersionMilestone, $this>
     */
    public function versionMilestones(): HasMany
    {
        return $this->hasMany(VersionMilestone::class, 'expected_status_ID', 'ID');
    }

    /**
     * @return HasMany<BuildMilestone, $this>
     */
    public function buildMilestones(): HasMany
    {
        return $this->hasMany(BuildMilestone::class, 'expected_status_ID', 'ID');
    }

    /**
     * @return HasMany<GameMilestone, $this>
     */
    public function gameMilestones(): HasMany
    {
        return $this->hasMany(GameMilestone::class, 'expected_status_ID', 'ID');
    }
}
