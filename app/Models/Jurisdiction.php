<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'name',
    'name_english',
    'iso3166',
    'parent_ID',
    'flag',
    'color',
    'game_languages',
    'segment',
    'segment_name',
    'currency_name_english',
    'iso4217',
    'currency_symbol',
    'symbol_position',
    'separators',
    'authority_ID',
    'xfer_letter_reqd',
    'denominations',
    'min_bet',
    'max_bet',
    'min_RTP',
    'max_BG_win',
    'max_JP_win',
    'min_reel_run_time',
    'auto_start',
    'gamble',
    'dev_URL_HW',
    'dev_URL_SW',
    'comment',
    'attributes',
])]
class Jurisdiction extends Model
{
    public const SEGMENTS = [
        'land-based',
        'online',
    ];

    public const SYMBOL_POSITIONS = [
        'prefix',
        'postfix',
    ];

    public const SEPARATORS = [
        '123,456.78',
        '123.456,78',
    ];

    public const AUTO_START = [
        'forbidden',
        'allowed',
        'mandatory',
        '',
    ];

    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(function (Jurisdiction $jurisdiction): void {
            $jurisdiction->mod_date = now();
        });

        static::deleting(function (Jurisdiction $jurisdiction): void {
            if ($jurisdiction->children()->exists()) {
                throw new \RuntimeException('Cannot delete a jurisdiction that still has child jurisdictions.');
            }

            if ($jurisdiction->landbasedMarket()->exists()) {
                throw new \RuntimeException('Cannot delete a jurisdiction that still has a land-based market.');
            }

            if ($jurisdiction->onlineMarket()->exists()) {
                throw new \RuntimeException('Cannot delete a jurisdiction that still has an online market.');
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
            'xfer_letter_reqd' => 'boolean',
            'gamble' => 'boolean',
            'attributes' => 'array',
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
     * @return BelongsTo<Authority, $this>
     */
    public function authority(): BelongsTo
    {
        return $this->belongsTo(Authority::class, 'authority_ID', 'ID');
    }

    /**
     * @return BelongsTo<Jurisdiction, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_ID', 'ID');
    }

    /**
     * @return HasMany<Jurisdiction, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_ID', 'ID');
    }

    /**
     * @return HasOne<MarketLandbased, $this>
     */
    public function landbasedMarket(): HasOne
    {
        return $this->hasOne(MarketLandbased::class, 'jurisdiction_ID', 'ID');
    }

    /**
     * @return HasOne<MarketOnline, $this>
     */
    public function onlineMarket(): HasOne
    {
        return $this->hasOne(MarketOnline::class, 'jurisdiction_ID', 'ID');
    }

    /**
     * @return HasMany<StakeJurisdiction, $this>
     */
    public function stakes(): HasMany
    {
        return $this->hasMany(StakeJurisdiction::class, 'jurisdiction_ID', 'ID');
    }

    /**
     * @return HasMany<Venue, $this>
     */
    public function venues(): HasMany
    {
        return $this->hasMany(Venue::class, 'jurisdiction_ID', 'ID');
    }

    /**
     * @return HasMany<PartnerActivity, $this>
     */
    public function partnerActivities(): HasMany
    {
        return $this->hasMany(PartnerActivity::class, 'jurisdiction_ID', 'ID');
    }

    /**
     * @return HasMany<Build, $this>
     */
    public function builds(): HasMany
    {
        return $this->hasMany(Build::class, 'jurisdiction_ID', 'ID');
    }

    /**
     * @return HasMany<Dongle, $this>
     */
    public function dongles(): HasMany
    {
        return $this->hasMany(Dongle::class, 'jurisdiction_ID', 'ID');
    }

    /**
     * @return HasMany<VersionMilestone, $this>
     */
    public function versionMilestones(): HasMany
    {
        return $this->hasMany(VersionMilestone::class, 'jurisdiction_ID', 'ID');
    }

    /**
     * @return HasMany<Availability, $this>
     */
    public function availabilities(): HasMany
    {
        return $this->hasMany(Availability::class, 'jurisdiction_ID', 'ID');
    }

    /**
     * @return HasMany<Installation, $this>
     */
    public function installations(): HasMany
    {
        return $this->hasMany(Installation::class, 'jurisdiction_ID', 'ID');
    }

    /**
     * @return HasMany<FocusGroup, $this>
     */
    public function focusGroups(): HasMany
    {
        return $this->hasMany(FocusGroup::class, 'jurisdiction_ID', 'ID');
    }
}
