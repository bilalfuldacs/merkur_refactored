<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VersionMilestone;

class VersionMilestonePolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, VersionMilestone $versionMilestone): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, VersionMilestone $versionMilestone): bool
    {
        return $user->canDeleteItems();
    }
}
