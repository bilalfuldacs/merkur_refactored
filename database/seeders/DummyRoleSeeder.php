<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class DummyRoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Dummy Superuser',
                'description' => 'Dummy admin role with every permission.',
                'needs_subscriptions' => false,
                'may_create-update_items' => true,
                'may_delete_items' => true,
                'may_create-update-delete_system-items' => true,
                'may_use_tlp-red' => true,
                'may_access_unsubscribed-markets' => true,
            ],
            [
                'name' => 'Dummy Editor',
                'description' => 'Dummy role that can create and update items.',
                'needs_subscriptions' => false,
                'may_create-update_items' => true,
                'may_delete_items' => false,
                'may_create-update-delete_system-items' => false,
                'may_use_tlp-red' => true,
                'may_access_unsubscribed-markets' => true,
            ],
            [
                'name' => 'Dummy Sales',
                'description' => 'Dummy read-only role limited to subscribed markets.',
                'needs_subscriptions' => true,
                'may_create-update_items' => false,
                'may_delete_items' => false,
                'may_create-update-delete_system-items' => false,
                'may_use_tlp-red' => false,
                'may_access_unsubscribed-markets' => false,
            ],
            [
                'name' => 'Dummy Viewer',
                'description' => 'Dummy read-only role with access to all markets.',
                'needs_subscriptions' => false,
                'may_create-update_items' => false,
                'may_delete_items' => false,
                'may_create-update-delete_system-items' => false,
                'may_use_tlp-red' => true,
                'may_access_unsubscribed-markets' => true,
            ],
        ];

        foreach ($roles as $role) {
            Role::query()->updateOrCreate(
                ['name' => $role['name']],
                $role
            );
        }
    }
}
