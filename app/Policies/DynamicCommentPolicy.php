<?php

namespace App\Policies;

use App\Models\DynamicComment;
use App\Models\User;

class DynamicCommentPolicy
{
    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, DynamicComment $dynamicComment): bool
    {
        return (int) $dynamicComment->mod_by === (int) $user->ID;
    }

    public function delete(User $user, DynamicComment $dynamicComment): bool
    {
        return (int) $dynamicComment->mod_by === (int) $user->ID;
    }
}
