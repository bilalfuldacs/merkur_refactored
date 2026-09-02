<?php

namespace Database\Seeders;

use App\Models\Partner;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyPartnerSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();

        $partners = [
            ['name' => 'Dummy Holland Casino', 'website' => 'https://hc.nl', 'active' => true],
            ['name' => 'Dummy MERKUR SPIELBANKEN', 'website' => 'https://merkur-spielbanken.de', 'active' => true],
            ['name' => 'Dummy Olympic Entertainment Group', 'website' => 'https://olympic-casino.com', 'active' => true],
            ['name' => 'Dummy Spielbank Berlin', 'website' => 'https://www.spielbank-berlin.de', 'active' => true],
            ['name' => 'Dummy JvH Gaming', 'website' => 'https://jvhgaming.com', 'active' => true],
            ['name' => 'Dummy Janshen-Hahnraths Group', 'website' => 'https://jh-group.nl', 'active' => true],
            ['name' => 'Dummy Casino Rodos', 'website' => 'https://casinorodos.gr', 'active' => true],
            ['name' => 'Dummy Big Bola', 'website' => 'https://www.bigbola.com', 'active' => true],
            ['name' => 'Dummy Melco', 'website' => 'https://www.melco-resorts.com', 'active' => true],
            ['name' => 'Dummy MERKUR Casino', 'website' => 'https://merkur.group', 'active' => true],
            ['name' => 'Dummy Grand Casino Baden', 'website' => 'https://www.grandcasinobaden.ch', 'active' => true],
            ['name' => 'Dummy Grupo Caliente', 'website' => 'https://www.caliente.mx', 'active' => true],
            ['name' => 'Dummy Cirsa', 'website' => 'https://www.cirsa.com', 'active' => true],
            ['name' => 'Dummy Luckia', 'website' => 'https://www.luckia.es', 'active' => true],
            ['name' => 'Dummy Admiral', 'website' => null, 'active' => true],
            ['name' => 'Dummy CoAm Gaming', 'website' => 'https://www.coamgaming.nl', 'active' => true],
            ['name' => 'Dummy Casinò Di Venezia', 'website' => 'https://www.casinovenezia.it', 'active' => true],
            ['name' => 'Dummy Meridian Bet', 'website' => 'https://meridianbet.rs', 'active' => false],
        ];

        foreach ($partners as $data) {
            $partner = Partner::query()->firstOrNew(['name' => $data['name']]);
            $partner->website = $data['website'];
            $partner->active = $data['active'];
            $partner->mod_by = $editor->ID;
            $partner->save();
        }
    }
}
