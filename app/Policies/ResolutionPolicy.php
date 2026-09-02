<?php

namespace App\Policies;

use App\Models\Resolution;
use App\Models\User;

class ResolutionPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, Resolution $resolution): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, Resolution $resolution): bool
    {
        return $user->canDeleteItems();
    }
}
