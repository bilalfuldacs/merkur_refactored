<?php

namespace App\Policies;

use App\Models\Partner;
use App\Models\User;

class PartnerPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, Partner $partner): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, Partner $partner): bool
    {
        return $user->canDeleteItems();
    }
}
