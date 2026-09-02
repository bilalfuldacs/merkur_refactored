<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'name2',
    'subtitle',
    'platform_ID',
    'status_ID',
    'description',
    'inherits_ID',
    'feat_in_products_pano',
    'feat_in_instl_feedback',
    'dev_URL',
])]
class Version extends Model
{
    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(function (Version $version): void {
            $version->mod_date = now();
        });

        static::deleting(function (Version $version): void {
            if ($version->inheritedBy()->exists()) {
                throw new \RuntimeException('Cannot delete a version that is still inherited by other versions.');
            }

            if ($version->gamesFrom()->exists()) {
                throw new \RuntimeException('Cannot delete a version that still has games.');
            }

            if ($version->gameReusesFrom()->exists()) {
                throw new \RuntimeException('Cannot delete a version that still has game reuses.');
            }

            if ($version->features()->exists()) {
                throw new \RuntimeException('Cannot delete a version that still has features.');
            }

            if ($version->builds()->exists()) {
                throw new \RuntimeException('Cannot delete a version that still has builds.');
            }

            if ($version->dongles()->exists()) {
                throw new \RuntimeException('Cannot delete a version that still has dongles.');
            }

            if ($version->defects()->exists()) {
                throw new \RuntimeException('Cannot delete a version that still has defects.');
            }

            if ($version->milestones()->exists()) {
                throw new \RuntimeException('Cannot delete a version that still has milestones.');
            }

            if ($version->availabilities()->exists()) {
                throw new \RuntimeException('Cannot delete a version that still has availabilities.');
            }

            if ($version->compatibilities()->exists()) {
                throw new \RuntimeException('Cannot delete a version that still has compatibilities.');
            }

            if ($version->installations()->exists()) {
                throw new \RuntimeException('Cannot delete a version that still has installations.');
            }

            if ($version->focusGroups()->exists()) {
                throw new \RuntimeException('Cannot delete a version that still has focus groups.');
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
            'feat_in_products_pano' => 'boolean',
            'feat_in_instl_feedback' => 'boolean',
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
     * @return BelongsTo<Platform, $this>
     */
    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class, 'platform_ID', 'ID');
    }

    /**
     * @return BelongsTo<ConfigStatus, $this>
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(ConfigStatus::class, 'status_ID', 'ID');
    }

    /**
     * @return BelongsTo<Version, $this>
     */
    public function inherits(): BelongsTo
    {
        return $this->belongsTo(self::class, 'inherits_ID', 'ID');
    }

    /**
     * @return HasMany<Version, $this>
     */
    public function inheritedBy(): HasMany
    {
        return $this->hasMany(self::class, 'inherits_ID', 'ID');
    }

    /**
     * @return HasMany<Game, $this>
     */
    public function gamesFrom(): HasMany
    {
        return $this->hasMany(Game::class, 'version_from_ID', 'ID');
    }

    /**
     * @return HasMany<GameReuse, $this>
     */
    public function gameReusesFrom(): HasMany
    {
        return $this->hasMany(GameReuse::class, 'version_from_ID', 'ID');
    }

    /**
     * @return HasMany<Feature, $this>
     */
    public function features(): HasMany
    {
        return $this->hasMany(Feature::class, 'version_ID', 'ID');
    }

    /**
     * @return HasMany<Build, $this>
     */
    public function builds(): HasMany
    {
        return $this->hasMany(Build::class, 'version_ID', 'ID');
    }

    /**
     * @return HasMany<Dongle, $this>
     */
    public function dongles(): HasMany
    {
        return $this->hasMany(Dongle::class, 'version_ID', 'ID');
    }

    /**
     * @return HasMany<Defect, $this>
     */
    public function defects(): HasMany
    {
        return $this->hasMany(Defect::class, 'version_ID', 'ID');
    }

    /**
     * @return HasMany<VersionMilestone, $this>
     */
    public function milestones(): HasMany
    {
        return $this->hasMany(VersionMilestone::class, 'version_ID', 'ID');
    }

    /**
     * @return HasMany<Availability, $this>
     */
    public function availabilities(): HasMany
    {
        return $this->hasMany(Availability::class, 'version_ID', 'ID');
    }

    /**
     * @return HasMany<Compatibility, $this>
     */
    public function compatibilities(): HasMany
    {
        return $this->hasMany(Compatibility::class, 'version_ID', 'ID');
    }

    /**
     * @return HasMany<Installation, $this>
     */
    public function installations(): HasMany
    {
        return $this->hasMany(Installation::class, 'version_ID', 'ID');
    }

    /**
     * @return HasMany<FocusGroup, $this>
     */
    public function focusGroups(): HasMany
    {
        return $this->hasMany(FocusGroup::class, 'version_ID', 'ID');
    }

    /**
     * @return array<string, mixed>
     */
    public static function panoramaEagerLoads(): array
    {
        return [
            'platform',
            'status',
            'availabilities' => function ($query): void {
                $query->select('availabilities.*')
                    ->leftJoin('jurisdictions', 'jurisdictions.ID', '=', 'availabilities.jurisdiction_ID')
                    ->orderBy('availabilities.priority')
                    ->orderBy('jurisdictions.iso3166')
                    ->with('jurisdiction');
            },
            'compatibilities' => function ($query): void {
                $query->select('compatibilities.*')
                    ->join('components', 'components.ID', '=', 'compatibilities.component_ID')
                    ->leftJoin('hardware_types', 'hardware_types.ID', '=', 'components.type_ID')
                    ->orderBy('hardware_types.name')
                    ->orderBy('components.name')
                    ->with('component.type');
            },
            'milestones' => function ($query): void {
                $query->orderBy('expected_date')
                    ->orderBy('actual_date')
                    ->with(['jurisdiction', 'expectedStatus']);
            },
            'gamesFrom.concept.studio',
            'gameReusesFrom.originalGame.concept.studio',
            'features' => fn ($query) => $query->orderBy('name'),
            'builds' => function ($query): void {
                $query->orderByDesc('name')->with([
                    'jurisdiction',
                    'status',
                    'milestones' => fn ($milestones) => $milestones->orderBy('expected_date')->with('expectedStatus'),
                    'softwareRelease' => fn ($release) => $release->whereNotNull('release_date'),
                ]);
            },
        ];
    }
}
