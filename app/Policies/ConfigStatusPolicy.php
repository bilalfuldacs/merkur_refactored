<?php

namespace App\Policies;

use App\Models\ConfigStatus;
use App\Models\User;

class ConfigStatusPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, ConfigStatus $configStatus): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, ConfigStatus $configStatus): bool
    {
        return $user->canDeleteItems();
    }
}
