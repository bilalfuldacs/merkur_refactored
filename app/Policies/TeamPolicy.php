<?php

namespace App\Policies;

use App\Models\Team;
use App\Models\User;

class TeamPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, Team $team): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, Team $team): bool
    {
        return $user->canDeleteItems();
    }
}
