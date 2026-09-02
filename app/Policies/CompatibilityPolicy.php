<?php

namespace App\Policies;

use App\Models\Compatibility;
use App\Models\User;

class CompatibilityPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, Compatibility $compatibility): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, Compatibility $compatibility): bool
    {
        return $user->canDeleteItems();
    }
}
