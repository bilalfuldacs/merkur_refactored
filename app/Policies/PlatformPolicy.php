<?php

namespace App\Policies;

use App\Models\Platform;
use App\Models\User;

class PlatformPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, Platform $platform): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, Platform $platform): bool
    {
        return $user->canDeleteItems();
    }
}
