<?php

namespace App\Policies;

use App\Models\Feature;
use App\Models\User;

class FeaturePolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, Feature $feature): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, Feature $feature): bool
    {
        return $user->canDeleteItems();
    }
}
