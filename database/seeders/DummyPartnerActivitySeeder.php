<?php

namespace Database\Seeders;

use App\Models\Jurisdiction;
use App\Models\Partner;
use App\Models\PartnerActivity;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyPartnerActivitySeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $partners = Partner::query()->get()->keyBy('name');
        $jurisdictions = Jurisdiction::query()->get()->keyBy('name_english');

        $activities = [
            [
                'partner' => 'Dummy Holland Casino',
                'jurisdiction' => 'Dummy Netherlands Casino',
                'key_customer' => true,
                'total_machines' => 2800,
                'share_of_mfrs' => 'MERKUR 40%, IGT 25%, Novomatic 20%, other 15%',
            ],
            [
                'partner' => 'Dummy MERKUR SPIELBANKEN',
                'jurisdiction' => 'Dummy Germany',
                'key_customer' => true,
                'total_machines' => 4200,
                'share_of_mfrs' => 'MERKUR 70%, Novomatic 20%, other 10%',
            ],
            [
                'partner' => 'Dummy Spielbank Berlin',
                'jurisdiction' => 'Dummy Germany',
                'key_customer' => true,
                'total_machines' => 650,
                'share_of_mfrs' => 'MERKUR 45%, IGT 30%, other 25%',
            ],
            [
                'partner' => 'Dummy Cirsa',
                'jurisdiction' => 'Dummy Spain Arcade',
                'key_customer' => true,
                'total_machines' => 1800,
                'share_of_mfrs' => 'Novomatic 35%, MERKUR 20%, Cirsa 25%, other 20%',
            ],
            [
                'partner' => 'Dummy Luckia',
                'jurisdiction' => 'Dummy Spain Arcade',
                'key_customer' => false,
                'total_machines' => 420,
                'share_of_mfrs' => 'Novomatic 50%, MERKUR 15%, other 35%',
            ],
            [
                'partner' => 'Dummy Cirsa',
                'jurisdiction' => 'Dummy France',
                'key_customer' => false,
                'total_machines' => 210,
                'share_of_mfrs' => 'IGT 40%, MERKUR 10%, other 50%',
            ],
            [
                'partner' => 'Dummy Grupo Caliente',
                'jurisdiction' => 'Dummy Colombia',
                'key_customer' => true,
                'total_machines' => 960,
                'share_of_mfrs' => 'MERKUR 25%, Aristocrat 30%, other 45%',
            ],
            [
                'partner' => 'Dummy Admiral',
                'jurisdiction' => 'Dummy Austria',
                'key_customer' => true,
                'total_machines' => 540,
                'share_of_mfrs' => 'Novomatic 60%, MERKUR 20%, other 20%',
            ],
            [
                'partner' => 'Dummy Grupo Caliente',
                'jurisdiction' => 'Dummy Colombia Online',
                'key_customer' => true,
                'total_machines' => null,
                'share_of_mfrs' => null,
                'total_online_games' => 420,
                'merkur_online_games' => 38,
            ],
        ];

        foreach ($activities as $data) {
            $activity = PartnerActivity::query()->firstOrNew([
                'partner_ID' => $partners[$data['partner']]->ID,
                'jurisdiction_ID' => $jurisdictions[$data['jurisdiction']]->ID,
            ]);
            $activity->key_customer = $data['key_customer'];
            $activity->total_machines = $data['total_machines'] ?? null;
            $activity->share_of_mfrs = $data['share_of_mfrs'] ?? null;
            $activity->total_online_games = $data['total_online_games'] ?? null;
            $activity->merkur_online_games = $data['merkur_online_games'] ?? null;
            $activity->mod_by = $editor->ID;
            $activity->save();
        }
    }
}
