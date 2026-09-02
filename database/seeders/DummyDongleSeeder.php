<?php

namespace Database\Seeders;

use App\Models\Dongle;
use App\Models\Jurisdiction;
use App\Models\User;
use App\Models\Version;
use Illuminate\Database\Seeder;

class DummyDongleSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $germany = Jurisdiction::query()->where('name_english', 'Dummy Germany')->firstOrFail();
        $nl = Jurisdiction::query()->where('name_english', 'Dummy Netherlands Casino')->firstOrFail();
        $v10 = Version::query()->where('name', 'Dummy 1.0')->firstOrFail();
        $v11 = Version::query()->where('name', 'Dummy 1.1')->firstOrFail();

        $dongles = [
            [
                'name' => 'D0001_R001',
                'name2' => 'Dummy M-Line HD, 4 dummy games',
                'version_ID' => $v10->ID,
                'jurisdiction_ID' => $germany->ID,
                'salesforce_URL' => 'https://dummy.test/salesforce/D0001_R001',
            ],
            [
                'name' => 'NL0001_R001',
                'name2' => 'Dummy Heroes NL casino pack',
                'version_ID' => $v11->ID,
                'jurisdiction_ID' => $nl->ID,
                'salesforce_URL' => null,
            ],
        ];

        foreach ($dongles as $data) {
            $dongle = Dongle::query()->firstOrNew(['name' => $data['name']]);
            $dongle->fill($data);
            $dongle->mod_by = $editor->ID;
            $dongle->save();
        }
    }
}
