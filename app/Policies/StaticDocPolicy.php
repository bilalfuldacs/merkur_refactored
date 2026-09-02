<?php

namespace App\Policies;

use App\Models\StaticDoc;
use App\Models\User;

class StaticDocPolicy
{
    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, StaticDoc $staticDoc): bool
    {
        return $staticDoc->isOwnedBy($user);
    }

    public function delete(User $user, StaticDoc $staticDoc): bool
    {
        return $staticDoc->isOwnedBy($user) && $staticDoc->isUserUpload();
    }
}
