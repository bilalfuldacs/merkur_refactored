<?php

namespace Database\Seeders;

use App\Models\Jurisdiction;
use App\Models\MarketLandbased;
use App\Models\MarketOnline;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyMarketSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();

        $landbased = [
            ['jurisdiction' => 'Dummy Netherlands Casino', 'cluster' => 'regular', 'venues' => 14, 'egms' => 4200, 'merkur' => 380],
            ['jurisdiction' => 'Dummy Germany', 'cluster' => 'regular', 'venues' => 220, 'egms' => 180000, 'merkur' => 12000],
            ['jurisdiction' => 'Dummy Colombia', 'cluster' => 'regular', 'venues' => 90, 'egms' => 28000, 'merkur' => 2100],
            ['jurisdiction' => 'Dummy Austria', 'cluster' => 'regular', 'venues' => 12, 'egms' => 1600, 'merkur' => 140],
            ['jurisdiction' => 'Dummy France', 'cluster' => 'focal', 'venues' => 200, 'egms' => 52000, 'merkur' => 800],
            ['jurisdiction' => 'Dummy Spain Arcade', 'cluster' => 'regular', 'venues' => 180, 'egms' => 45000, 'merkur' => 1500],
        ];

        foreach ($landbased as $data) {
            $jurisdiction = Jurisdiction::query()
                ->where('name_english', $data['jurisdiction'])
                ->where('segment', 'land-based')
                ->firstOrFail();

            $market = MarketLandbased::query()->firstOrNew([
                'jurisdiction_ID' => $jurisdiction->ID,
            ]);
            $market->jurisdiction_segment = 'land-based';
            $market->cluster = $data['cluster'];
            $market->setAttribute('total_#_of_venues', $data['venues']);
            $market->setAttribute('total_#_of_EGMs', $data['egms']);
            $market->setAttribute('#_of_MERKUR_EGMs', $data['merkur']);
            $market->mod_by = $editor->ID;
            $market->save();
        }

        $online = [
            ['jurisdiction' => 'Dummy Germany Online', 'cluster' => 'regular'],
            ['jurisdiction' => 'Dummy Colombia Online', 'cluster' => 'regular'],
        ];

        foreach ($online as $data) {
            $jurisdiction = Jurisdiction::query()
                ->where('name_english', $data['jurisdiction'])
                ->where('segment', 'online')
                ->firstOrFail();

            $market = MarketOnline::query()->firstOrNew([
                'jurisdiction_ID' => $jurisdiction->ID,
            ]);
            $market->jurisdiction_segment = 'online';
            $market->cluster = $data['cluster'];
            $market->smartphone = true;
            $market->tablet = true;
            $market->desktop = true;
            $market->mod_by = $editor->ID;
            $market->save();
        }
    }
}
