<?php

namespace App\Policies;

use App\Models\MarketOnline;
use App\Models\User;

class MarketOnlinePolicy
{
    public function view(User $user, MarketOnline $marketOnline): bool
    {
        return $user->canViewMarketForJurisdiction((int) $marketOnline->jurisdiction_ID);
    }

    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, MarketOnline $marketOnline): bool
    {
        return $user->canCreateUpdateItems() && $this->view($user, $marketOnline);
    }

    public function delete(User $user, MarketOnline $marketOnline): bool
    {
        return $user->canDeleteItems() && $this->view($user, $marketOnline);
    }
}
