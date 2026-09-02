<?php

namespace App\Policies;

use App\Models\MatrixTemplate;
use App\Models\User;

class MatrixTemplatePolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, MatrixTemplate $matrixTemplate): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, MatrixTemplate $matrixTemplate): bool
    {
        return $user->canDeleteItems();
    }
}
