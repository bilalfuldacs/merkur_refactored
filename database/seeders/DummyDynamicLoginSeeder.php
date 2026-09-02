<?php

namespace Database\Seeders;

use App\Models\DynamicLogin;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyDynamicLoginSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $editor = User::query()->where('username', 'editor@dummy.test')->firstOrFail();

        $logins = [
            [
                'user_ID' => $admin->ID,
                'IP' => '127.0.0.1',
                'agent' => 'Dummy Admin Browser',
            ],
            [
                'user_ID' => $editor->ID,
                'IP' => '127.0.0.1',
                'agent' => 'Dummy Editor Browser',
            ],
        ];

        foreach ($logins as $data) {
            $login = DynamicLogin::query()->firstOrNew([
                'user_ID' => $data['user_ID'],
                'agent' => $data['agent'],
            ]);
            $login->IP = $data['IP'];
            $login->save();
        }
    }
}
