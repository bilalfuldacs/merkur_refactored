<?php

namespace App\Policies;

use App\Models\Defect;
use App\Models\User;

class DefectPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, Defect $defect): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, Defect $defect): bool
    {
        return $user->canDeleteItems();
    }
}
