<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DummyUserSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password');

        $users = [
            [
                'username' => 'admin@dummy.test',
                'initials' => 'ADM',
                'firstname' => 'Ada',
                'lastname' => 'Admin',
                'role' => 'Dummy Superuser',
                'jobtitle' => 'Dummy Superuser',
            ],
            [
                'username' => 'editor@dummy.test',
                'initials' => 'EDT',
                'firstname' => 'Eddy',
                'lastname' => 'Editor',
                'role' => 'Dummy Editor',
                'jobtitle' => 'Dummy Editor',
            ],
            [
                'username' => 'sales@dummy.test',
                'initials' => 'SAL',
                'firstname' => 'Sam',
                'lastname' => 'Sales',
                'role' => 'Dummy Sales',
                'jobtitle' => 'Dummy Sales',
            ],
            [
                'username' => 'viewer@dummy.test',
                'initials' => 'VEW',
                'firstname' => 'Vera',
                'lastname' => 'Viewer',
                'role' => 'Dummy Viewer',
                'jobtitle' => 'Dummy Viewer',
            ],
        ];

        foreach ($users as $data) {
            $role = Role::query()->where('name', $data['role'])->firstOrFail();

            $user = User::query()->firstOrNew(['username' => $data['username']]);
            $user->fill([
                'initials' => $data['initials'],
                'active' => true,
                'firstname' => $data['firstname'],
                'lastname' => $data['lastname'],
                'prefix' => null,
                'password' => $password,
                'beta' => false,
                'jobtitle' => $data['jobtitle'],
                'decolorize_avatars' => false,
                'appearance' => 'auto',
                'notifications' => 'off',
            ]);
            $user->role()->associate($role);
            $user->save();
        }
    }
}
