<?php

namespace App\Policies;

use App\Models\BuildMilestone;
use App\Models\User;

class BuildMilestonePolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, BuildMilestone $buildMilestone): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, BuildMilestone $buildMilestone): bool
    {
        return $user->canDeleteItems();
    }
}
