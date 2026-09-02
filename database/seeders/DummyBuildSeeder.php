<?php

namespace Database\Seeders;

use App\Models\Build;
use App\Models\ConfigStatus;
use App\Models\Jurisdiction;
use App\Models\User;
use App\Models\Version;
use Illuminate\Database\Seeder;

class DummyBuildSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $germany = Jurisdiction::query()->where('name_english', 'Dummy Germany')->firstOrFail();
        $nl = Jurisdiction::query()->where('name_english', 'Dummy Netherlands Casino')->firstOrFail();
        $released = ConfigStatus::query()->findOrFail(600);
        $inRd = ConfigStatus::query()->findOrFail(300);
        $v10 = Version::query()->where('name', 'Dummy 1.0')->firstOrFail();
        $v11 = Version::query()->where('name', 'Dummy 1.1')->firstOrFail();
        $vOnline = Version::query()->where('name', 'Dummy Online 1.0')->firstOrFail();

        $builds = [
            [
                'name' => 'Dummy 1.0.1',
                'version_ID' => $v10->ID,
                'jurisdiction_ID' => $germany->ID,
                'status_ID' => $released->ID,
                'comment' => 'Dummy Germany release of Dummy 1.0',
                'p_label' => 'Dummy DE 1.0.1',
                'checksum_system' => 'DUMMYSYS10',
                'checksum_verify' => 'DUMMYVER10',
                'checksum_app' => 'DUMMYAPP10',
            ],
            [
                'name' => 'Dummy 1.1.1',
                'version_ID' => $v11->ID,
                'jurisdiction_ID' => $nl->ID,
                'status_ID' => $inRd->ID,
                'comment' => 'Dummy NL casino build of Dummy 1.1',
                'p_label' => 'Dummy NL 1.1.1',
            ],
            [
                'name' => 'Dummy OL 1.0.1',
                'version_ID' => $vOnline->ID,
                'jurisdiction_ID' => null,
                'status_ID' => $released->ID,
                'comment' => 'Dummy online build without a single jurisdiction',
            ],
        ];

        foreach ($builds as $data) {
            $build = Build::query()->firstOrNew(['name' => $data['name']]);
            $build->fill($data);
            $build->mod_by = $editor->ID;
            $build->save();
        }
    }
}
