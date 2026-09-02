<?php

namespace App\Policies;

use App\Models\GameReuse;
use App\Models\User;

class GameReusePolicy
{
    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, GameReuse $gameReuse): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function delete(User $user, GameReuse $gameReuse): bool
    {
        return $user->canDeleteItems();
    }
}
