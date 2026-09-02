<?php

namespace App\Policies;

use App\Models\Availability;
use App\Models\User;

class AvailabilityPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, Availability $availability): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, Availability $availability): bool
    {
        return $user->canDeleteItems();
    }
}
