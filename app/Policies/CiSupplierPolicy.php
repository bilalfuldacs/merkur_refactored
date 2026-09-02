<?php

namespace App\Policies;

use App\Models\CiSupplier;
use App\Models\User;

class CiSupplierPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, CiSupplier $ciSupplier): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, CiSupplier $ciSupplier): bool
    {
        return $user->canDeleteItems();
    }
}
