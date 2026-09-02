<?php

namespace Database\Seeders;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyTeamSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();

        $teams = [
            [
                'name' => 'Dummy adp',
                'color' => '#ffc000',
                'type' => 'Studio (Game Design)',
                'website' => 'https://adp-gauselmann.de',
                'has_contact' => true,
            ],
            [
                'name' => 'Dummy Blueprint',
                'color' => '#3c7d22',
                'type' => 'Studio (Game Design)',
                'website' => 'https://blueprintgaming.com',
                'has_contact' => false,
            ],
            [
                'name' => 'Dummy Gamomat',
                'color' => null,
                'type' => 'Studio (Game Design)',
                'website' => 'https://gamomat.com',
                'has_contact' => false,
            ],
            [
                'name' => 'Dummy High 5 Games',
                'color' => null,
                'type' => 'Studio (Game Design)',
                'website' => 'https://high5games.com',
                'has_contact' => false,
            ],
            [
                'name' => 'Dummy Kaiser Spiele',
                'color' => '#ff9999',
                'type' => 'Studio (Game Design)',
                'website' => 'https://kaiserspiele.de',
                'has_contact' => true,
            ],
            [
                'name' => 'Dummy Lucky Nugget',
                'color' => '#c00000',
                'type' => 'Studio (Game Design)',
                'website' => null,
                'has_contact' => true,
            ],
            [
                'name' => 'Dummy MEGA',
                'color' => '#d0d0d0',
                'type' => 'Studio (Game Design)',
                'website' => 'https://mega-spiel.de',
                'has_contact' => true,
            ],
            [
                'name' => 'Dummy MERKUR Gaming Vienna',
                'color' => '#00ffff',
                'type' => 'Studio (Game Design)',
                'website' => null,
                'has_contact' => true,
            ],
            [
                'name' => 'Dummy Reel Time Gaming',
                'color' => '#92d050',
                'type' => 'Studio (Game Design)',
                'website' => 'https://reeltimegaming.com',
                'has_contact' => true,
            ],
            [
                'name' => 'Dummy Stella',
                'color' => '#0070c0',
                'type' => 'Studio (Game Design)',
                'website' => null,
                'has_contact' => true,
            ],
            [
                'name' => 'Dummy Titan Gaming',
                'color' => '#cc99ff',
                'type' => 'Studio (Game Design)',
                'website' => null,
                'has_contact' => true,
            ],
            [
                'name' => 'Dummy SUNLab',
                'color' => null,
                'type' => 'Studio (Game Design)',
                'website' => null,
                'has_contact' => true,
            ],
            [
                'name' => 'Dummy Wave',
                'color' => null,
                'type' => 'Studio (Game Design)',
                'website' => null,
                'has_contact' => true,
            ],
            [
                'name' => 'Dummy MERKUR Excellence',
                'color' => null,
                'type' => 'Studio (Game Design)',
                'website' => null,
                'has_contact' => true,
            ],
            [
                'name' => 'Dummy Gaming Arts',
                'color' => null,
                'type' => 'Studio (Game Design)',
                'website' => 'https://gamingarts.com',
                'has_contact' => true,
            ],
            [
                'name' => 'Dummy V-Teck',
                'color' => null,
                'type' => 'Studio (Game Design)',
                'website' => null,
                'has_contact' => false,
            ],
            [
                'name' => 'Dummy Dosniha',
                'color' => null,
                'type' => 'Studio (Game Design)',
                'website' => null,
                'has_contact' => false,
            ],
            [
                'name' => 'Dummy Strategic Intelligence Hub',
                'color' => null,
                'type' => 'Product Organization',
                'website' => null,
                'has_contact' => true,
            ],
            [
                'name' => 'Dummy Market Intel & Data Strat',
                'color' => null,
                'type' => 'Product Organization',
                'website' => null,
                'has_contact' => true,
            ],
            [
                'name' => 'Dummy Blueprint',
                'color' => '#3c7d22',
                'type' => '3rd Party',
                'website' => null,
                'has_contact' => false,
            ],
            [
                'name' => 'Dummy White Hat Studios',
                'color' => null,
                'type' => '3rd Party',
                'website' => null,
                'has_contact' => false,
            ],
            [
                'name' => 'Dummy Evolution',
                'color' => null,
                'type' => '3rd Party',
                'website' => null,
                'has_contact' => false,
            ],
            [
                'name' => 'Dummy VegasLowRoller Studios',
                'color' => null,
                'type' => '3rd Party',
                'website' => null,
                'has_contact' => false,
            ],
        ];

        foreach ($teams as $data) {
            $team = Team::query()->firstOrNew([
                'name' => $data['name'],
                'type' => $data['type'],
            ]);
            $team->color = $data['color'];
            $team->website = $data['website'];
            $team->mod_by = $editor->ID;
            $team->primary_contact_ID = $data['has_contact'] ? $editor->ID : null;
            $team->save();
        }
    }
}
