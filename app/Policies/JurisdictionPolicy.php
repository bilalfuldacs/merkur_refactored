<?php

namespace App\Policies;

use App\Models\Jurisdiction;
use App\Models\User;

class JurisdictionPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, Jurisdiction $jurisdiction): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, Jurisdiction $jurisdiction): bool
    {
        return $user->canDeleteItems();
    }
}
