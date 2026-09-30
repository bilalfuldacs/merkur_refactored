<?php

namespace App\Policies;

use App\Models\MerkuriosityWord;
use App\Models\User;

class MerkuriosityWordPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, MerkuriosityWord $merkuriosityWord): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, MerkuriosityWord $merkuriosityWord): bool
    {
        return $user->canDeleteItems();
    }
}
