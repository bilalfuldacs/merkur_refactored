<?php

namespace Database\Seeders;

use App\Models\FocusGroup;
use App\Models\Jurisdiction;
use App\Models\User;
use App\Models\Version;
use Illuminate\Database\Seeder;

class DummyFocusGroupSeeder extends Seeder
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
                'start_date' => '2026-02-10',
                'test_comment' => 'Dummy players liked the Dummy 1.0 menu.',
                'ramifications' => 'Dummy: keep the new game selection menu.',
            ],
            [
                'version_ID' => $v11->ID,
                'jurisdiction_ID' => $nl->ID,
                'start_date' => '2026-08-15',
                'test_comment' => 'Dummy NL session still pending.',
                'ramifications' => null,
            ],
        ];

        foreach ($rows as $data) {
            $row = FocusGroup::query()->firstOrNew([
                'version_ID' => $data['version_ID'],
                'jurisdiction_ID' => $data['jurisdiction_ID'],
                'start_date' => $data['start_date'],
            ]);
            $row->fill($data);
            $row->mod_by = $editor->ID;
            $row->save();
        }
    }
}
