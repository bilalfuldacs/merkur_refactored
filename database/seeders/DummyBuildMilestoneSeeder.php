<?php

namespace Database\Seeders;

use App\Models\Build;
use App\Models\BuildMilestone;
use App\Models\ConfigStatus;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyBuildMilestoneSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $released = ConfigStatus::query()->findOrFail(600);
        $qa = ConfigStatus::query()->findOrFail(301);
        $build101 = Build::query()->where('name', 'Dummy 1.0.1')->firstOrFail();
        $build111 = Build::query()->where('name', 'Dummy 1.1.1')->firstOrFail();

        $rows = [
            [
                'build_ID' => $build101->ID,
                'expected_status_ID' => $released->ID,
                'expected_date' => '2026-03-10',
                'actual_date' => '2026-03-18',
                'comment' => 'Dummy initial Germany HD release',
            ],
            [
                'build_ID' => $build111->ID,
                'expected_status_ID' => $qa->ID,
                'expected_date' => '2026-08-01',
                'actual_date' => null,
                'comment' => 'Dummy NL build still in QA',
            ],
        ];

        foreach ($rows as $data) {
            $milestone = BuildMilestone::query()->firstOrNew([
                'build_ID' => $data['build_ID'],
                'expected_status_ID' => $data['expected_status_ID'],
            ]);
            $milestone->fill($data);
            $milestone->mod_by = $editor->ID;
            $milestone->save();
        }
    }
}
