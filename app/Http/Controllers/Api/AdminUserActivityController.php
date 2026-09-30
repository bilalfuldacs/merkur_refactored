<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminUserActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isSuperuser(), 403, 'Superuser access required.');

        $sort = $request->string('sort')->toString() === 'logins' ? 'logins' : 'last_login';
        $orderSql = $sort === 'logins'
            ? 'num_logins DESC, last_login DESC'
            : 'last_login DESC, num_logins DESC';

        $rows = DB::select(
            "SELECT dynamic__logins.user_ID,
                    dynamic__users.username,
                    dynamic__users.firstname,
                    dynamic__users.lastname,
                    dynamic__users.active,
                    COUNT(*) AS num_logins,
                    MAX(`when`) AS last_login
             FROM dynamic__logins
             LEFT JOIN dynamic__users ON dynamic__users.ID = dynamic__logins.user_ID
             GROUP BY dynamic__logins.user_ID, dynamic__users.username, dynamic__users.firstname,
                      dynamic__users.lastname, dynamic__users.active
             ORDER BY {$orderSql}"
        );

        return response()->json([
            'sort' => $sort,
            'users' => array_map(static fn (object $row): array => [
                'user_ID' => (int) $row->user_ID,
                'username' => $row->username,
                'firstname' => $row->firstname,
                'lastname' => $row->lastname,
                'active' => (bool) $row->active,
                'num_logins' => (int) $row->num_logins,
                'last_login' => $row->last_login,
            ], $rows),
        ]);
    }
}
