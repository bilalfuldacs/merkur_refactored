<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Version;

class VersionPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, Version $version): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, Version $version): bool
    {
        return $user->canDeleteItems();
    }
}
