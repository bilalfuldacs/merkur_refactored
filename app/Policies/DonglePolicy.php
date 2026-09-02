<?php

namespace App\Policies;

use App\Models\Dongle;
use App\Models\User;

class DonglePolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, Dongle $dongle): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, Dongle $dongle): bool
    {
        return $user->canDeleteItems();
    }
}
