<?php

namespace Database\Seeders;

use App\Models\Availability;
use App\Models\Jurisdiction;
use App\Models\User;
use App\Models\Version;
use Illuminate\Database\Seeder;

class DummyAvailabilitySeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $germany = Jurisdiction::query()->where('name_english', 'Dummy Germany')->firstOrFail();
        $nl = Jurisdiction::query()->where('name_english', 'Dummy Netherlands Casino')->firstOrFail();
        $v10 = Version::query()->where('name', 'Dummy 1.0')->firstOrFail();
        $v11 = Version::query()->where('name', 'Dummy 1.1')->firstOrFail();

        $rows = [
            [
                'version_ID' => $v10->ID,
                'jurisdiction_ID' => $germany->ID,
                'status' => 'availability',
                'priority' => '‼️ high',
                'comment' => 'Dummy Germany may receive Dummy 1.0',
            ],
            [
                'version_ID' => $v11->ID,
                'jurisdiction_ID' => $nl->ID,
                'status' => 'intent',
                'priority' => 'standard',
                'comment' => 'Dummy NL intent for Dummy 1.1',
            ],
        ];

        foreach ($rows as $data) {
            $row = Availability::query()->firstOrNew([
                'version_ID' => $data['version_ID'],
                'jurisdiction_ID' => $data['jurisdiction_ID'],
            ]);
            $row->fill($data);
            $row->mod_by = $editor->ID;
            $row->save();
        }
    }
}
