<?php

namespace App\Policies;

use App\Models\Component;
use App\Models\User;

class ComponentPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, Component $component): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, Component $component): bool
    {
        return $user->canDeleteItems();
    }
}
