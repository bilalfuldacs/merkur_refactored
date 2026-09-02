<?php

namespace Database\Seeders;

use App\Models\Configuration;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyConfigurationSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();

        foreach (['12345678', '21601300', '60125043', 'DCFG0001'] as $sku) {
            $configuration = Configuration::query()->firstOrNew(['SKU' => $sku]);
            $configuration->mod_by = $editor->ID;
            $configuration->save();
        }
    }
}
