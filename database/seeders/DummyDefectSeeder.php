<?php

namespace Database\Seeders;

use App\Models\Build;
use App\Models\Defect;
use App\Models\Game;
use App\Models\User;
use App\Models\Version;
use Illuminate\Database\Seeder;

class DummyDefectSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $llc = Game::query()->where('ID_text', 'DLLC')->firstOrFail();
        $sizzling = Game::query()->where('ID_text', 'DSIZ')->firstOrFail();
        $book = Game::query()->where('ID_text', 'DBOR')->firstOrFail();
        $v10 = Version::query()->where('name', 'Dummy 1.0')->firstOrFail();
        $build101 = Build::query()->where('name', 'Dummy 1.0.1')->firstOrFail();

        $defects = [
            [
                'game_ID' => $llc->ID,
                'version_ID' => $v10->ID,
                'build_ID' => null,
                'name' => 'Dummy Excessive payout',
                'description' => 'Dummy: excessive payout may occur on a sidebet. Disable this game on Dummy 1.0.',
            ],
            [
                'game_ID' => $sizzling->ID,
                'version_ID' => null,
                'build_ID' => $build101->ID,
                'name' => 'Dummy Game freeze',
                'description' => 'Dummy: game may stop responding when many wilds appear. Disable on Dummy 1.0.1.',
            ],
            [
                'game_ID' => $book->ID,
                'version_ID' => null,
                'build_ID' => null,
                'name' => 'Dummy Non-existent symbol combinations',
                'description' => 'Dummy: invalid symbol combinations can display. Remove from the library.',
            ],
        ];

        foreach ($defects as $data) {
            $defect = Defect::query()->firstOrNew([
                'game_ID' => $data['game_ID'],
                'name' => $data['name'],
            ]);
            $defect->fill($data);
            $defect->mod_by = $editor->ID;
            $defect->save();
        }
    }
}
