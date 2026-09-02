<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DynamicLogin;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class OnlineUserController extends Controller
{
    private const LOOKBACK_HOURS = 48;

    private const RECENT_HOURS = 5;

    private const LIMIT = 11;

    public function index(): JsonResponse
    {
        $since = now()->subHours(self::LOOKBACK_HOURS);
        $recentSince = now()->subHours(self::RECENT_HOURS);

        $rows = DynamicLogin::query()
            ->select('user_ID')
            ->selectRaw('MAX(`when`) as last_login_at')
            ->where('when', '>=', $since)
            ->groupBy('user_ID')
            ->orderByDesc('last_login_at')
            ->limit(self::LIMIT)
            ->get();

        $users = User::query()
            ->whereIn('ID', $rows->pluck('user_ID'))
            ->get()
            ->keyBy('ID');

        $payload = $rows
            ->map(function (DynamicLogin $row) use ($users, $recentSince): ?array {
                $user = $users->get($row->user_ID);
                if (! $user instanceof User) {
                    return null;
                }

                $lastLogin = Carbon::parse($row->last_login_at);

                return [
                    'ID' => $user->ID,
                    'initials' => $user->initials,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                    'name' => $user->name_COMBINED
                        ?: trim(($user->firstname ?? '').' '.($user->lastname ?? ''))
                        ?: $user->username,
                    'bcolor' => $user->bcolor,
                    'color' => $user->color,
                    'role_ID' => $user->role_ID,
                    'last_login_at' => $lastLogin->toIso8601String(),
                    'recent' => $lastLogin->gte($recentSince),
                ];
            })
            ->filter()
            ->values();

        return response()->json([
            'now' => now()->toIso8601String(),
            'users' => $payload,
        ]);
    }
}
