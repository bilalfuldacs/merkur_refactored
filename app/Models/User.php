<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'initials',
    'active',
    'lastname',
    'firstname',
    'prefix',
    'username',
    'password',
    'bcolor',
    'color',
    'role_ID',
    'beta',
    'jobtitle',
    'birthday',
    'decolorize_avatars',
    'appearance',
    'notifications',
    'last_ads_mail_timestamp',
    'iceattendent2027',
])]
#[Hidden(['password'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'dynamic__users';

    protected $primaryKey = 'ID';

    public $timestamps = false;

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
            'active' => 'boolean',
            'beta' => 'boolean',
            'decolorize_avatars' => 'boolean',
            'iceattendent2027' => 'boolean',
            'birthday' => 'date',
            'last_ads_mail_timestamp' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Role, $this>
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_ID', 'ID');
    }

    public function assignRole(Role|int $role): static
    {
        $role = $role instanceof Role
            ? $role
            : Role::query()->findOrFail($role);

        $this->role()->associate($role);
        $this->save();

        return $this;
    }

    public function isSuperuser(): bool
    {
        return $this->role?->canManageSystemItems() === true;
    }

    public function canCreateUpdateItems(): bool
    {
        return $this->role?->canCreateUpdateItems() === true;
    }

    public function canDeleteItems(): bool
    {
        return $this->role?->canDeleteItems() === true;
    }

    public function canUseTlpRed(): bool
    {
        return $this->role?->canUseTlpRed() === true;
    }

    public function canAccessUnsubscribedMarkets(): bool
    {
        return $this->role?->canAccessUnsubscribedMarkets() === true;
    }

    public function isIceAttendant(): bool
    {
        return (bool) $this->iceattendent2027;
    }

    public function canSeeIce2027(): bool
    {
        return $this->isIceAttendant() || $this->isSuperuser();
    }

    public function displayName(): string
    {
        $combined = trim((string) ($this->firstname ?? '').' '.($this->lastname ?? ''));

        return $combined !== '' ? $combined : (string) $this->username;
    }

    public function canViewMarketForJurisdiction(int $jurisdictionId): bool
    {
        if ($this->canAccessUnsubscribedMarkets()) {
            return true;
        }

        return $this->jurisdictionStakes()->where('jurisdiction_ID', $jurisdictionId)->exists();
    }

    public function getAuthPassword(): string
    {
        return (string) $this->getRawOriginal('password');
    }

    /**
     * @return HasMany<StakeJurisdiction, $this>
     */
    public function jurisdictionStakes(): HasMany
    {
        return $this->hasMany(StakeJurisdiction::class, 'person_ID', 'ID');
    }

    /**
     * @return HasMany<DynamicLogin, $this>
     */
    public function logins(): HasMany
    {
        return $this->hasMany(DynamicLogin::class, 'user_ID', 'ID');
    }
}
