<?php

namespace Database\Seeders;

use App\Models\Feature;
use App\Models\User;
use App\Models\Version;
use Illuminate\Database\Seeder;

class DummyFeatureSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $v10 = Version::query()->where('name', 'Dummy 1.0')->firstOrFail();
        $v11 = Version::query()->where('name', 'Dummy 1.1')->firstOrFail();
        $v20 = Version::query()->where('name', 'Dummy 2.0 UHD')->firstOrFail();

        $features = [
            [
                'name' => 'Dummy New game selection menu',
                'ID_text' => 'DMEN',
                'version_ID' => $v10->ID,
                'description' => 'Dummy refresh of the game selection menu on Dummy 1.0.',
                'dev_URL' => null,
            ],
            [
                'name' => 'Dummy MERKUR Mystery jackpot',
                'ID_text' => 'DMJM',
                'version_ID' => $v11->ID,
                'description' => 'Dummy mystery jackpot feature introduced on Dummy 1.1.',
                'dev_URL' => 'https://dummy.test/features/dmjm',
            ],
            [
                'name' => 'Dummy Support for 4 displays',
                'ID_text' => null,
                'version_ID' => $v20->ID,
                'description' => 'Dummy multi-display support on the UHD line.',
                'dev_URL' => null,
            ],
        ];

        foreach ($features as $data) {
            $feature = Feature::query()->firstOrNew(['name' => $data['name']]);
            $feature->fill($data);
            $feature->mod_by = $editor->ID;
            $feature->save();
        }
    }
}
