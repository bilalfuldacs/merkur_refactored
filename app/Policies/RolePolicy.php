<?php

namespace App\Policies;

use App\Models\Role;
use App\Models\User;

class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperuser();
    }

    public function create(User $user): bool
    {
        return $user->isSuperuser();
    }

    public function update(User $user, Role $role): bool
    {
        return $user->isSuperuser();
    }

    public function delete(User $user, Role $role): bool
    {
        return $user->isSuperuser();
    }
    
}
