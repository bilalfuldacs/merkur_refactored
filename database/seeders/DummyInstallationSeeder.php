<?php

namespace Database\Seeders;

use App\Models\Installation;
use App\Models\Jurisdiction;
use App\Models\User;
use App\Models\Venue;
use App\Models\Version;
use Illuminate\Database\Seeder;

class DummyInstallationSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $germany = Jurisdiction::query()->where('name_english', 'Dummy Germany')->firstOrFail();
        $nl = Jurisdiction::query()->where('name_english', 'Dummy Netherlands Casino')->firstOrFail();
        $v10 = Version::query()->where('name', 'Dummy 1.0')->firstOrFail();
        $v11 = Version::query()->where('name', 'Dummy 1.1')->firstOrFail();
        $duisburg = Venue::query()->where('name', 'Dummy Merkur Duisburg')->firstOrFail();
        $amsterdam = Venue::query()->where('name', 'Dummy Amsterdam')->firstOrFail();

        $rows = [
            [
                'version_ID' => $v10->ID,
                'jurisdiction_ID' => $germany->ID,
                'venue_ID' => $duisburg->ID,
                'first_install_date' => '2026-03-22',
                'live' => 12,
                'test' => 2,
                'planned' => 4,
                'perf_rating' => 80,
                'tech_rating' => 'green',
                'first_install_type' => 'new',
                'rtp' => '96.2',
                'test_comment' => 'Dummy Duisburg floor trial looks stable.',
            ],
            [
                'version_ID' => $v11->ID,
                'jurisdiction_ID' => $nl->ID,
                'venue_ID' => $amsterdam->ID,
                'first_install_date' => null,
                'live' => 0,
                'test' => 0,
                'planned' => 6,
                'tech_rating' => 'yellow',
                'first_install_type' => 'conversion',
                'planned_comment' => 'Dummy Amsterdam conversion still scheduled.',
            ],
        ];

        foreach ($rows as $data) {
            $row = Installation::query()->firstOrNew([
                'version_ID' => $data['version_ID'],
                'venue_ID' => $data['venue_ID'],
            ]);
            $row->fill($data);
            $row->mod_by = $editor->ID;
            $row->save();
        }
    }
}
