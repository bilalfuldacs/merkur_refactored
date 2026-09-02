<?php

namespace App\Policies;

use App\Models\PartnerActivity;
use App\Models\User;

class PartnerActivityPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, PartnerActivity $partnerActivity): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, PartnerActivity $partnerActivity): bool
    {
        return $user->canDeleteItems();
    }
}
