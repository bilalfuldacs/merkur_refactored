<?php

namespace App\Policies;

use App\Models\MarketLandbased;
use App\Models\User;

class MarketLandbasedPolicy
{
    public function view(User $user, MarketLandbased $marketLandbased): bool
    {
        return $user->canViewMarketForJurisdiction((int) $marketLandbased->jurisdiction_ID);
    }

    public function create(User $user): bool
    {
        return $user->canCreateUpdateItems();
    }

    public function update(User $user, MarketLandbased $marketLandbased): bool
    {
        return $user->canCreateUpdateItems() && $this->view($user, $marketLandbased);
    }

    public function delete(User $user, MarketLandbased $marketLandbased): bool
    {
        return $user->canDeleteItems() && $this->view($user, $marketLandbased);
    }
}
