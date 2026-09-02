<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'description',
    'needs_subscriptions',
    'may_create-update_items',
    'may_delete_items',
    'may_create-update-delete_system-items',
    'may_use_tlp-red',
    'may_access_unsubscribed-markets',
])]

class Role extends Model
{
    protected $table = 'config__roles';
    protected $primaryKey = 'ID';
    public $timestamps = false;

    public function getRouteKeyName(): string
    {
        return 'ID';
    }

    protected static function booted(): void
    {
        static::deleting(function (Role $role): void {
            if ($role->users()->exists()) {
                throw new \RuntimeException('Cannot delete a role that still has users.');
            }
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'needs_subscriptions' => 'boolean',
            'may_create-update_items' => 'boolean',
            'may_delete_items' => 'boolean',
            'may_create-update-delete_system-items' => 'boolean',
            'may_use_tlp-red' => 'boolean',
            'may_access_unsubscribed-markets' => 'boolean',
        ];
    }
    /**
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'role_ID', 'ID');
    }

    public function canCreateUpdateItems(): bool
    {
        return (bool) $this->getAttribute('may_create-update_items');
    }

    public function canDeleteItems(): bool
    {
        return (bool) $this->may_delete_items;
    }

    public function canManageSystemItems(): bool
    {
        return (bool) $this->getAttribute('may_create-update-delete_system-items');
    }

    public function canUseTlpRed(): bool
    {
        return (bool) $this->getAttribute('may_use_tlp-red');
    }

    public function canAccessUnsubscribedMarkets(): bool
    {
        return (bool) $this->getAttribute('may_access_unsubscribed-markets');
    }
}
