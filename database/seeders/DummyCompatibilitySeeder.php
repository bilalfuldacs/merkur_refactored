<?php

namespace Database\Seeders;

use App\Models\Compatibility;
use App\Models\Component;
use App\Models\User;
use App\Models\Version;
use Illuminate\Database\Seeder;

class DummyCompatibilitySeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $v10 = Version::query()->where('name', 'Dummy 1.0')->firstOrFail();
        $v20 = Version::query()->where('name', 'Dummy 2.0 UHD')->firstOrFail();
        $tr4 = Component::query()->where('name', 'Dummy TR4')->firstOrFail();
        $printer = Component::query()->where('name', 'Dummy Ithaca Edge')->firstOrFail();

        $rows = [
            [
                'version_ID' => $v10->ID,
                'component_ID' => $tr4->ID,
                'comment' => 'Dummy 1.0 works with Dummy TR4',
            ],
            [
                'version_ID' => $v10->ID,
                'component_ID' => $printer->ID,
                'comment' => 'Dummy 1.0 works with Dummy Ithaca Edge',
            ],
            [
                'version_ID' => $v20->ID,
                'component_ID' => $tr4->ID,
                'comment' => 'Dummy UHD line also uses Dummy TR4',
            ],
        ];

        foreach ($rows as $data) {
            $row = Compatibility::query()->firstOrNew([
                'version_ID' => $data['version_ID'],
                'component_ID' => $data['component_ID'],
            ]);
            $row->fill($data);
            $row->mod_by = $editor->ID;
            $row->save();
        }
    }
}
