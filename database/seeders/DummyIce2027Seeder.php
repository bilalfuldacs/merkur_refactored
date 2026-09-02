<?php

namespace Database\Seeders;

use App\Models\Ice2027Competitor;
use App\Models\Ice2027Game;
use App\Models\Ice2027Team;
use App\Models\Ice2027TeamMember;
use App\Models\User;
use App\Services\Ice2027Service;
use Illuminate\Database\Seeder;

class DummyIce2027Seeder extends Seeder
{
    public function run(): void
    {
        $ice = app(Ice2027Service::class);
        $ice->seedTeamsIfEmpty();

        $usernames = ['admin@dummy.test', 'editor@dummy.test', 'sales@dummy.test'];
        $people = User::query()->whereIn('username', $usernames)->get()->keyBy('username');

        foreach ($people as $person) {
            $person->iceattendent2027 = true;
            $person->save();
        }

        $admin = $people->get('admin@dummy.test');
        $editor = $people->get('editor@dummy.test');
        $teamA = Ice2027Team::query()->orderBy('ID')->first();

        if ($teamA && $admin) {
            $memberIds = array_values(array_filter([
                (int) $admin->ID,
                $editor ? (int) $editor->ID : 0,
            ]));
            Ice2027TeamMember::query()->whereIn('user_ID', $memberIds)->delete();
            $ice->setTeamMembers((int) $teamA->ID, $memberIds);
        }

        if ($teamA && ! Ice2027Competitor::query()->exists()) {
            $createdBy = $admin?->ID;
            $zitro = Ice2027Competitor::query()->create([
                'name' => 'Zitro',
                'team_ID' => $teamA->ID,
                'created_by' => $createdBy,
                'created_at' => now(),
            ]);
            $novomatic = Ice2027Competitor::query()->create([
                'name' => 'Novomatic',
                'team_ID' => $teamA->ID,
                'created_by' => $createdBy,
                'created_at' => now(),
            ]);
            $igt = Ice2027Competitor::query()->create([
                'name' => 'IGT',
                'team_ID' => $teamA->ID,
                'created_by' => $createdBy,
                'created_at' => now(),
            ]);

            Ice2027Game::query()->create([
                'competitor_ID' => $zitro->ID,
                'name' => 'Fortune Link',
                'game_type' => 'mlp',
                'created_by' => $createdBy,
                'created_at' => now(),
            ]);
            Ice2027Game::query()->create([
                'competitor_ID' => $novomatic->ID,
                'name' => 'Book of Ra Deluxe',
                'game_type' => 'new_product',
                'created_by' => $createdBy,
                'created_at' => now(),
            ]);
            Ice2027Game::query()->create([
                'competitor_ID' => $igt->ID,
                'name' => 'Wheel of Fortune',
                'game_type' => 'multigame',
                'created_by' => $createdBy,
                'created_at' => now(),
            ]);
        }
    }
}
