<?php

namespace App\Policies;

use App\Models\HardwareType;
use App\Models\User;

class HardwareTypePolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, HardwareType $hardwareType): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, HardwareType $hardwareType): bool
    {
        return $user->canDeleteItems();
    }
}
