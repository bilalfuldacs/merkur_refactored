<?php

namespace App\Policies;

use App\Models\Authority;
use App\Models\User;

class AuthorityPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, Authority $authority): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, Authority $authority): bool
    {
        return $user->canDeleteItems();
    }
}
