<?php

namespace Database\Seeders;

use App\Models\ConfigStatus;
use App\Models\Game;
use App\Models\GameMilestone;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyGameMilestoneSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $performance = ConfigStatus::query()->findOrFail(400);
        $inRd = ConfigStatus::query()->findOrFail(300);
        $llc = Game::query()->where('ID_text', 'DLLC')->firstOrFail();
        $sizzling = Game::query()->where('ID_text', 'DSIZ')->firstOrFail();

        $rows = [
            [
                'game_ID' => $llc->ID,
                'expected_status_ID' => $performance->ID,
                'expected_date' => '2026-04-01',
                'actual_date' => '2026-04-12',
                'comment' => 'Dummy performance trial for DLLC',
            ],
            [
                'game_ID' => $sizzling->ID,
                'expected_status_ID' => $inRd->ID,
                'expected_date' => '2026-10-01',
                'actual_date' => null,
                'comment' => 'Dummy Sizzling Hot still in R&D',
            ],
        ];

        foreach ($rows as $data) {
            $milestone = GameMilestone::query()->firstOrNew([
                'game_ID' => $data['game_ID'],
                'expected_status_ID' => $data['expected_status_ID'],
            ]);
            $milestone->fill($data);
            $milestone->mod_by = $editor->ID;
            $milestone->save();
        }
    }
}
