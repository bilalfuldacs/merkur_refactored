<?php

namespace Database\Seeders;

use App\Models\HardwareType;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyHardwareTypeSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();

        $types = [
            'Dummy Ticket Printer',
            'Dummy Bill Validator',
            'Dummy Lock',
            'Dummy Base',
            'Dummy CPU Module',
            'Dummy Button Panel',
        ];

        foreach ($types as $name) {
            $type = HardwareType::query()->firstOrNew(['name' => $name]);
            $type->mod_by = $editor->ID;
            $type->save();
        }
    }
}
