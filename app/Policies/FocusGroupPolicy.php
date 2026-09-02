<?php

namespace App\Policies;

use App\Models\FocusGroup;
use App\Models\User;

class FocusGroupPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, FocusGroup $focusGroup): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, FocusGroup $focusGroup): bool
    {
        return $user->canDeleteItems();
    }
}
