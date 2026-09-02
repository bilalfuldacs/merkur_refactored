<?php

namespace App\Policies;

use App\Models\Build;
use App\Models\User;

class BuildPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, Build $build): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, Build $build): bool
    {
        return $user->canDeleteItems();
    }
}
