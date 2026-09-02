<?php

namespace Database\Seeders;

use App\Models\Build;
use App\Models\Dongle;
use App\Models\SoftwareRelease;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummySoftwareReleaseSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $build = Build::query()->where('name', 'Dummy 1.0.1')->firstOrFail();
        $dongle = Dongle::query()->where('name', 'D0001_R001')->firstOrFail();

        $release = SoftwareRelease::query()->firstOrNew(['build_ID' => $build->ID]);
        $release->fill([
            'build_ID' => $build->ID,
            'release_date' => '2026-03-20',
            'release_by' => $editor->ID,
            'GLI_approval_status' => 'Dummy GLI approved for DE',
            'base_dongle_ID' => $dongle->ID,
            'suitable_for_cabinets' => 'Dummy Allegro, Dummy Avante',
            'suitable_for_markets' => 'Dummy Germany',
            'solved_issues' => 'Dummy: first Germany HD release notes.',
            'notes' => 'Dummy release of Dummy 1.0.1 on D0001_R001.',
        ]);
        $release->mod_by = $editor->ID;
        $release->save();
    }
}
