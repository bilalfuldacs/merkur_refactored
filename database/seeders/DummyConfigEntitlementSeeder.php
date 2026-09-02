<?php

namespace Database\Seeders;

use App\Models\ConfigEntitlement;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyConfigEntitlementSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $role = Role::query()->where('name', 'Dummy Superuser')->firstOrFail();

        $entitlement = ConfigEntitlement::query()->firstOrNew([
            'table' => 'markets_landbased',
            'role_ID' => $role->ID,
        ]);
        $entitlement->note = 'Dummy Superuser may manage land-based market reports.';
        $entitlement->mod_by = $editor->ID;
        $entitlement->save();
    }
}
