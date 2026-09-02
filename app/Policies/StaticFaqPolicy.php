<?php

namespace App\Policies;

use App\Models\StaticFaq;
use App\Models\User;

class StaticFaqPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, StaticFaq $staticFaq): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, StaticFaq $staticFaq): bool
    {
        return $user->canDeleteItems();
    }
}
