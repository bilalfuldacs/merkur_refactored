<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function create(User $user): bool
    {
        return $user->isSuperuser();
    }
    public function update(User $user, User $userToUpdate): bool
    {
        return $user->isSuperuser();
    }
    public function delete(User $user, User $userToDelete): bool
    {
        return $user->isSuperuser() && ! $user->is($userToDelete);
    }
}
