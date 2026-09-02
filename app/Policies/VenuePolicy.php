<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Venue;

class VenuePolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, Venue $venue): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, Venue $venue): bool
    {
        return $user->canDeleteItems();
    }
}
