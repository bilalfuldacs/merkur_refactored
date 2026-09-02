<?php

namespace Database\Seeders;

use App\Models\Component;
use App\Models\HardwareType;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyComponentSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();

        $components = [
            ['SKU' => '60070954', 'name' => 'Dummy Ithaca EPIC 950', 'type' => 'Dummy Ticket Printer'],
            ['SKU' => '60084381', 'name' => 'Dummy Future Logic GEN2', 'type' => 'Dummy Ticket Printer'],
            ['SKU' => '60105479', 'name' => 'Dummy Future Logic GEN5', 'type' => 'Dummy Ticket Printer'],
            ['SKU' => '60125043', 'name' => 'Dummy Ithaca Edge', 'type' => 'Dummy Ticket Printer'],
            ['SKU' => '60132064', 'name' => 'Dummy JCM iVizion', 'type' => 'Dummy Bill Validator'],
            ['SKU' => '60070955', 'name' => 'Dummy JCM UBA 10', 'type' => 'Dummy Bill Validator'],
            ['SKU' => '60084382', 'name' => 'Dummy MEI Cashflow SC83', 'type' => 'Dummy Bill Validator'],
            ['SKU' => '60088952', 'name' => 'Dummy Shipping Lock', 'type' => 'Dummy Lock'],
            ['SKU' => '60099844', 'name' => 'Dummy CLS Lock', 'type' => 'Dummy Lock'],
            ['SKU' => '21601300', 'name' => 'Dummy Slant Top Low', 'type' => 'Dummy Base'],
            ['SKU' => '21601200', 'name' => 'Dummy Slant Top', 'type' => 'Dummy Base'],
            ['SKU' => '21542000', 'name' => 'Dummy Upright', 'type' => 'Dummy Base'],
            ['SKU' => null, 'name' => 'Dummy i3', 'type' => 'Dummy CPU Module'],
            ['SKU' => null, 'name' => 'Dummy TR3', 'type' => 'Dummy CPU Module'],
            ['SKU' => null, 'name' => 'Dummy TR4', 'type' => 'Dummy CPU Module'],
            ['SKU' => null, 'name' => 'Dummy V2000', 'type' => 'Dummy CPU Module'],
            ['SKU' => null, 'name' => 'Dummy Mechanical', 'type' => 'Dummy Button Panel'],
            ['SKU' => null, 'name' => 'Dummy Video', 'type' => 'Dummy Button Panel'],
        ];

        foreach ($components as $data) {
            $type = HardwareType::query()->where('name', $data['type'])->firstOrFail();

            $component = Component::query()->firstOrNew(['name' => $data['name']]);
            $component->SKU = $data['SKU'];
            $component->type()->associate($type);
            $component->mod_by = $editor->ID;
            $component->save();
        }
    }
}
