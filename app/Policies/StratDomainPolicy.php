<?php

namespace App\Policies;

use App\Models\StratDomain;
use App\Models\User;

class StratDomainPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, StratDomain $stratDomain): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, StratDomain $stratDomain): bool
    {
        return $user->canDeleteItems();
    }
}
