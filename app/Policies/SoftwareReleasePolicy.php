<?php

namespace App\Policies;

use App\Models\SoftwareRelease;
use App\Models\User;

class SoftwareReleasePolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, SoftwareRelease $softwareRelease): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, SoftwareRelease $softwareRelease): bool
    {
        return $user->canDeleteItems();
    }
}
