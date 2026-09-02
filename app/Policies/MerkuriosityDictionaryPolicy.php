<?php

namespace App\Policies;

use App\Models\MerkuriosityDictionary;
use App\Models\User;

class MerkuriosityDictionaryPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, MerkuriosityDictionary $merkuriosityDictionary): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, MerkuriosityDictionary $merkuriosityDictionary): bool
    {
        return $user->canDeleteItems();
    }
}
