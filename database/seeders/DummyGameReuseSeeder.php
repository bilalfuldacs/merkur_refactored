<?php

namespace Database\Seeders;

use App\Models\Game;
use App\Models\GameReuse;
use App\Models\User;
use App\Models\Version;
use Illuminate\Database\Seeder;

class DummyGameReuseSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $llc = Game::query()->where('ID_text', 'DLLC')->firstOrFail();
        $sizzling = Game::query()->where('ID_text', 'DSIZ')->firstOrFail();
        $v20 = Version::query()->where('name', 'Dummy 2.0 UHD')->firstOrFail();
        $v11 = Version::query()->where('name', 'Dummy 1.1')->firstOrFail();

        $rows = [
            [
                'original_game_port_ID' => $llc->ID,
                'version_from_ID' => $v20->ID,
                'version_removed_ID' => null,
            ],
            [
                'original_game_port_ID' => $sizzling->ID,
                'version_from_ID' => $v11->ID,
                'version_removed_ID' => null,
            ],
        ];

        foreach ($rows as $data) {
            $reuse = GameReuse::query()->firstOrNew([
                'original_game_port_ID' => $data['original_game_port_ID'],
                'version_from_ID' => $data['version_from_ID'],
            ]);
            $reuse->version_removed_ID = $data['version_removed_ID'];
            $reuse->mod_by = $editor->ID;
            $reuse->save();
        }
    }
}
