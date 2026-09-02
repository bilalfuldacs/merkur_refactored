<?php

namespace Database\Seeders;

use App\Models\GameConcept;
use App\Models\Jurisdiction;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyGameConceptSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $germany = Jurisdiction::query()->where('name_english', 'Dummy Germany')->first();

        $concepts = [
            [
                'name' => "Dummy Lucky Lady's Charm",
                'studio' => 'Dummy adp',
                'theme' => 'Irish luck',
                'portfolio_strategy' => 'Evolution of Proprietary Game',
                'target_market' => true,
                'base_game_USP' => 'Classic charm scatter with stacked wilds on a familiar 10-line layout.',
                'feature_game_USP' => 'Free games with an extra wild and increasing multiplier.',
                'IP_licensed' => false,
                'trademarked_EU' => true,
            ],
            [
                'name' => "Dummy Lucky Lady's Charm deluxe",
                'studio' => 'Dummy adp',
                'variant_of' => "Dummy Lucky Lady's Charm",
                'theme' => 'Irish luck',
                'portfolio_strategy' => 'Evolution of Proprietary Game',
                'base_game_USP' => 'Deluxe refresh of the classic charm game with updated math.',
                'feature_game_USP' => 'Free games with extra wild and rising multiplier.',
                'IP_licensed' => false,
                'trademarked_EU' => true,
            ],
            [
                'name' => 'Dummy Sizzling Hot',
                'studio' => 'Dummy adp',
                'theme' => 'Fruit',
                'portfolio_strategy' => 'Evolution of Proprietary Game',
                'base_game_USP' => 'Five-reel fruit game with simple line pays and a hot seven.',
                'IP_licensed' => false,
                'trademarked_EU' => true,
            ],
            [
                'name' => 'Dummy Book of Ra',
                'studio' => 'Dummy adp',
                'theme' => 'Egypt',
                'portfolio_strategy' => 'Evolution of Proprietary Game',
                'target_market' => true,
                'base_game_USP' => 'Expanding book symbol that acts as both wild and scatter.',
                'feature_game_USP' => 'Free spins with one expanding special symbol.',
                'IP_licensed' => false,
                'trademarked_EU' => true,
                'trademarked_UK' => true,
            ],
            [
                'name' => "Dummy Dolphin's Pearl",
                'studio' => 'Dummy adp',
                'theme' => 'Ocean',
                'portfolio_strategy' => 'New',
                'base_game_USP' => 'Underwater five-reel game with pearl scatter.',
                'feature_game_USP' => 'Free games with extra wild dolphins.',
                'IP_licensed' => false,
            ],
            [
                'name' => 'Dummy Just Jewels',
                'studio' => 'Dummy adp',
                'theme' => 'Jewels',
                'portfolio_strategy' => 'New',
                'base_game_USP' => 'Gemstone symbols on a short, readable paytable.',
                'IP_licensed' => false,
            ],
            [
                'name' => 'Dummy Columbus',
                'studio' => 'Dummy adp',
                'theme' => 'Adventure',
                'portfolio_strategy' => 'New',
                'base_game_USP' => 'Explorer theme with stacked wilds on the ship.',
                'IP_licensed' => false,
            ],
            [
                'name' => 'Dummy Money Game',
                'studio' => 'Dummy MEGA',
                'theme' => 'Classic',
                'portfolio_strategy' => 'New',
                'base_game_USP' => 'Cash and sevens on a compact reel set.',
                'IP_licensed' => false,
            ],
            [
                'name' => 'Dummy Wandering City',
                'studio' => 'Dummy Blueprint',
                'third_party' => 'Dummy Blueprint',
                'theme' => 'City',
                'portfolio_strategy' => 'Cross Leveraging Success',
                'base_game_USP' => 'Cluster pays in a moving city skyline.',
                'IP_licensed' => true,
                'trademarked_UK' => true,
                'trademarked_US' => true,
            ],
            [
                'name' => 'Dummy Multi Wild',
                'studio' => 'Dummy Gamomat',
                'theme' => 'Wilds',
                'portfolio_strategy' => 'Competitive Response',
                'base_game_USP' => 'Multiple wild types that stack and walk the reels.',
                'IP_licensed' => false,
            ],
            [
                'name' => 'Dummy Crown Gems',
                'studio' => 'Dummy High 5 Games',
                'theme' => 'Jewels',
                'portfolio_strategy' => 'New',
                'base_game_USP' => 'High-value gem grid with crown wilds.',
                'IP_licensed' => false,
            ],
            [
                'name' => 'Dummy Vienna Nights',
                'studio' => 'Dummy MERKUR Gaming Vienna',
                'theme' => 'City',
                'portfolio_strategy' => 'New',
                'target_market' => true,
                'base_game_USP' => 'Evening city theme aimed at land-based Europe.',
                'IP_licensed' => false,
                'trademarked_EU' => true,
            ],
        ];

        foreach ($concepts as $data) {
            $studio = Team::query()
                ->where('name', $data['studio'])
                ->where('type', 'Studio (Game Design)')
                ->firstOrFail();

            $concept = GameConcept::query()->firstOrNew(['name' => $data['name']]);
            $concept->studio()->associate($studio);
            $concept->theme = $data['theme'];
            $concept->portfolio_strategy = $data['portfolio_strategy'];
            $concept->base_game_USP = $data['base_game_USP'] ?? null;
            $concept->feature_game_USP = $data['feature_game_USP'] ?? null;
            $concept->IP_licensed = $data['IP_licensed'] ?? null;
            $concept->trademarked_EU = $data['trademarked_EU'] ?? null;
            $concept->trademarked_UK = $data['trademarked_UK'] ?? null;
            $concept->trademarked_US = $data['trademarked_US'] ?? null;
            $concept->trademarked_CA = $data['trademarked_CA'] ?? null;
            $concept->setAttribute('trademarked_AU-NZ', $data['trademarked_AU-NZ'] ?? null);
            $concept->pry_design_target_mkt = ($data['target_market'] ?? false) && $germany
                ? $germany->ID
                : null;
            $concept->setAttribute('3rd_party', isset($data['third_party'])
                ? Team::query()
                    ->where('name', $data['third_party'])
                    ->where('type', '3rd Party')
                    ->firstOrFail()
                    ->ID
                : null);
            $concept->variant_of_concept_ID = isset($data['variant_of'])
                ? GameConcept::query()->where('name', $data['variant_of'])->firstOrFail()->ID
                : null;
            $concept->mod_by = $editor->ID;
            $concept->save();
        }
    }
}
