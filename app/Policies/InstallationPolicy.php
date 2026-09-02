<?php

namespace App\Policies;

use App\Models\Installation;
use App\Models\User;

class InstallationPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, Installation $installation): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, Installation $installation): bool
    {
        return $user->canDeleteItems();
    }
}
