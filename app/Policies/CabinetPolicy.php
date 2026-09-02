<?php

namespace App\Policies;

use App\Models\Cabinet;
use App\Models\User;

class CabinetPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, Cabinet $cabinet): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, Cabinet $cabinet): bool
    {
        return $user->canDeleteItems();
    }
}
