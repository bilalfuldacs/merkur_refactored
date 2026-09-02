<?php

namespace App\Policies;

use App\Models\StakeJurisdiction;
use App\Models\User;

class StakeJurisdictionPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, StakeJurisdiction $stakeJurisdiction): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, StakeJurisdiction $stakeJurisdiction): bool
    {
        return $user->canDeleteItems();
    }
}
