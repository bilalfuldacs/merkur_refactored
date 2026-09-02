<?php

namespace Database\Seeders;

use App\Models\ConfigStatus;
use App\Models\Jurisdiction;
use App\Models\User;
use App\Models\Version;
use App\Models\VersionMilestone;
use Illuminate\Database\Seeder;

class DummyVersionMilestoneSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $germany = Jurisdiction::query()->where('name_english', 'Dummy Germany')->firstOrFail();
        $nl = Jurisdiction::query()->where('name_english', 'Dummy Netherlands Casino')->firstOrFail();
        $released = ConfigStatus::query()->findOrFail(600);
        $trial = ConfigStatus::query()->findOrFail(310);
        $v10 = Version::query()->where('name', 'Dummy 1.0')->firstOrFail();
        $v11 = Version::query()->where('name', 'Dummy 1.1')->firstOrFail();

        $rows = [
            [
                'version_ID' => $v10->ID,
                'jurisdiction_ID' => $germany->ID,
                'expected_status_ID' => $released->ID,
                'expected_date' => '2026-03-01',
                'actual_date' => '2026-03-15',
                'comment' => 'Dummy Germany release of Dummy 1.0',
            ],
            [
                'version_ID' => $v11->ID,
                'jurisdiction_ID' => $nl->ID,
                'expected_status_ID' => $trial->ID,
                'expected_date' => '2026-09-01',
                'actual_date' => null,
                'comment' => 'Dummy NL technical trial target',
            ],
        ];

        foreach ($rows as $data) {
            $milestone = VersionMilestone::query()->firstOrNew([
                'version_ID' => $data['version_ID'],
                'jurisdiction_ID' => $data['jurisdiction_ID'],
                'expected_status_ID' => $data['expected_status_ID'],
            ]);
            $milestone->fill($data);
            $milestone->mod_by = $editor->ID;
            $milestone->save();
        }
    }
}
