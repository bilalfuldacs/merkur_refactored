<?php

namespace Database\Seeders;

use App\Models\ConfigStatus;
use App\Models\Game;
use App\Models\GameConcept;
use App\Models\Platform;
use App\Models\Resolution;
use App\Models\User;
use App\Models\Version;
use Illuminate\Database\Seeder;

class DummyGameSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $owner = User::query()->where('username', 'editor@dummy.test')->firstOrFail();
        $mii = Platform::query()->where('name', 'Dummy MII')->firstOrFail();
        $online = Platform::query()->where('name', 'Dummy Online')->firstOrFail();
        $fhd = Resolution::query()->where('name', 'Dummy FHD 1920x1080')->firstOrFail();
        $uhd = Resolution::query()->where('name', 'Dummy UHD 2160x3840')->firstOrFail();
        $released = ConfigStatus::query()->findOrFail(600);
        $inRd = ConfigStatus::query()->findOrFail(300);
        $v10 = Version::query()->where('name', 'Dummy 1.0')->firstOrFail();
        $v11 = Version::query()->where('name', 'Dummy 1.1')->firstOrFail();
        $v20 = Version::query()->where('name', 'Dummy 2.0 UHD')->firstOrFail();
        $vOnline = Version::query()->where('name', 'Dummy Online 1.0')->firstOrFail();

        $games = [
            [
                'concept' => "Dummy Lucky Lady's Charm",
                'platform_ID' => $mii->ID,
                'resolution_ID' => $fhd->ID,
                'ID_text' => 'DLLC',
                'version_from_ID' => $v10->ID,
                'status_ID' => $released->ID,
                'estimated_effort' => 'medium ≥2500h <5000h',
                'in_roadmap_g' => true,
                'gli11' => true,
                'volatility' => '4',
                'lines' => '10',
                'reels' => '5',
                'engine' => 'proprietary',
                'progressive_type' => 'N/A',
                'cash_on_reels' => false,
                'hold_and_spin' => false,
                'true_persistence' => 'none',
            ],
            [
                'concept' => "Dummy Lucky Lady's Charm deluxe",
                'platform_ID' => $mii->ID,
                'resolution_ID' => $fhd->ID,
                'ID_text' => 'DLLD',
                'version_from_ID' => $v11->ID,
                'status_ID' => $inRd->ID,
                'estimated_effort' => 'low <2500h',
                'in_roadmap_g' => true,
                'volatility' => '4',
                'lines' => '10',
                'reels' => '5',
                'engine' => 'proprietary',
            ],
            [
                'concept' => 'Dummy Sizzling Hot',
                'platform_ID' => $mii->ID,
                'resolution_ID' => $uhd->ID,
                'ID_text' => 'DSIZ',
                'version_from_ID' => $v20->ID,
                'status_ID' => $inRd->ID,
                'in_roadmap_g' => false,
                'volatility' => '3',
                'lines' => '5',
                'reels' => '5',
                'engine' => 'Godot',
                'progressive_type' => 'Symbol Driven',
            ],
            [
                'concept' => 'Dummy Book of Ra',
                'platform_ID' => $online->ID,
                'resolution_ID' => null,
                'ID_text' => 'DBOR',
                'version_from_ID' => $vOnline->ID,
                'status_ID' => $released->ID,
                'in_roadmap_g' => true,
                'engine' => 'Unity',
                'volatility' => '5',
                'lines' => '10',
                'reels' => '5',
            ],
        ];

        foreach ($games as $data) {
            $concept = GameConcept::query()->where('name', $data['concept'])->firstOrFail();
            unset($data['concept']);

            $game = Game::query()->firstOrNew(['ID_text' => $data['ID_text']]);
            $game->fill($data);
            $game->concept_ID = $concept->ID;
            $game->pm_owner_ID = $owner->ID;
            $game->mod_by = $editor->ID;
            $game->save();
        }
    }
}
