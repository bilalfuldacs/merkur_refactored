<?php

namespace App\Policies;

use App\Models\DynamicPost;
use App\Models\User;

class DynamicPostPolicy
{
    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, DynamicPost $dynamicPost): bool
    {
        return $dynamicPost->isOwnedBy($user);
    }

    public function delete(User $user, DynamicPost $dynamicPost): bool
    {
        return $dynamicPost->isOwnedBy($user);
    }
}
