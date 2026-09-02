<?php

namespace App\Policies;

use App\Models\Configuration;
use App\Models\User;

class ConfigurationPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, Configuration $configuration): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, Configuration $configuration): bool
    {
        return $user->canDeleteItems();
    }
}
