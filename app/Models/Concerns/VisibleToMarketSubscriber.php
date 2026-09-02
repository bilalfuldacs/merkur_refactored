<?php

namespace App\Models\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

trait VisibleToMarketSubscriber
{
    /**
     * @param  Builder<covariant \Illuminate\Database\Eloquent\Model>  $query
     * @return Builder<covariant \Illuminate\Database\Eloquent\Model>
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->canAccessUnsubscribedMarkets()) {
            return $query;
        }

        return $query->whereIn(
            'jurisdiction_ID',
            $user->jurisdictionStakes()->select('jurisdiction_ID')
        );
    }
}
