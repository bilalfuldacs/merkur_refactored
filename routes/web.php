<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'Merkur API. Use /api/login, /api/users, /api/roles.',
    ]);
});
