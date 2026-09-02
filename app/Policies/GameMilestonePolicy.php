<?php

namespace App\Policies;

use App\Models\GameMilestone;
use App\Models\User;

class GameMilestonePolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, GameMilestone $gameMilestone): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, GameMilestone $gameMilestone): bool
    {
        return $user->canDeleteItems();
    }
}
