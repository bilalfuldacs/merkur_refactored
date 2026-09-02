<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'version_ID',
    'jurisdiction_ID',
    'name',
    'status_ID',
    'comment',
    'p_label',
    'checksum_system',
    'checksum_verify',
    'checksum_app',
])]
class Build extends Model
{
    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(function (Build $build): void {
            $build->mod_date = now();
        });

        static::deleting(function (Build $build): void {
            if ($build->softwareRelease()->exists()) {
                throw new \RuntimeException('Cannot delete a build that still has a release.');
            }

            if ($build->defects()->exists()) {
                throw new \RuntimeException('Cannot delete a build that still has defects.');
            }

            if ($build->milestones()->exists()) {
                throw new \RuntimeException('Cannot delete a build that still has milestones.');
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
     * @return BelongsTo<ConfigStatus, $this>
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(ConfigStatus::class, 'status_ID', 'ID');
    }

    /**
     * @return HasMany<Defect, $this>
     */
    public function defects(): HasMany
    {
        return $this->hasMany(Defect::class, 'build_ID', 'ID');
    }

    /**
     * @return HasMany<BuildMilestone, $this>
     */
    public function milestones(): HasMany
    {
        return $this->hasMany(BuildMilestone::class, 'build_ID', 'ID');
    }

    /**
     * @return HasOne<SoftwareRelease, $this>
     */
    public function softwareRelease(): HasOne
    {
        return $this->hasOne(SoftwareRelease::class, 'build_ID', 'ID');
    }
}
