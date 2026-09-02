<?php

namespace App\Policies;

use App\Models\GameConcept;
use App\Models\User;

class GameConceptPolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, GameConcept $gameConcept): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, GameConcept $gameConcept): bool
    {
        return $user->canDeleteItems();
    }
}
