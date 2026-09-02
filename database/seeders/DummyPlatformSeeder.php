<?php

namespace Database\Seeders;

use App\Models\Platform;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyPlatformSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();

        $platforms = [
            ['name' => 'Dummy MII', 'color' => '#ffcc00', 'tint_roadmap' => true],
            ['name' => 'Dummy Magie', 'color' => '#a2c617', 'tint_roadmap' => false],
            ['name' => 'Dummy Magie Spielbank', 'color' => '#a2c617', 'tint_roadmap' => false],
            ['name' => 'Dummy Online', 'color' => '#e83181', 'tint_roadmap' => false],
            ['name' => 'Dummy Gaming Arts', 'color' => '#eb0000', 'tint_roadmap' => true],
            ['name' => 'Dummy Dosniha', 'color' => null, 'tint_roadmap' => false],
            ['name' => 'Dummy Game Ring', 'color' => null, 'tint_roadmap' => false],
            ['name' => 'Dummy Blueprint', 'color' => '#0000ff', 'tint_roadmap' => false],
            ['name' => 'Dummy MG NL', 'color' => '#ff9300', 'tint_roadmap' => false],
            ['name' => 'Dummy MII ES', 'color' => '#ff0000', 'tint_roadmap' => false],
            ['name' => 'Dummy MII ES Toolbox', 'color' => '#ff2600', 'tint_roadmap' => false],
            ['name' => 'Dummy MII ES Engine', 'color' => '#ff0000', 'tint_roadmap' => false],
        ];

        foreach ($platforms as $data) {
            $platform = Platform::query()->firstOrNew(['name' => $data['name']]);
            $platform->color = $data['color'];
            $platform->tint_roadmap = $data['tint_roadmap'];
            $platform->mod_by = $editor->ID;
            $platform->save();
        }
    }
}
