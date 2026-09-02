<?php

namespace Database\Seeders;

use App\Models\Jurisdiction;
use App\Models\Partner;
use App\Models\User;
use App\Models\Venue;
use Illuminate\Database\Seeder;

class DummyVenueSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();

        $partners = Partner::query()->get()->keyBy('name');
        $jurisdictions = Jurisdiction::query()->get()->keyBy('name_english');

        $venues = [
            ['name' => 'Dummy Amsterdam', 'partner' => 'Dummy Holland Casino', 'jurisdiction' => 'Dummy Netherlands Casino', 'city' => 'Amsterdam'],
            ['name' => 'Dummy Amsterdam West', 'partner' => 'Dummy Holland Casino', 'jurisdiction' => 'Dummy Netherlands Casino', 'city' => 'Amsterdam'],
            ['name' => 'Dummy Breda', 'partner' => 'Dummy Holland Casino', 'jurisdiction' => 'Dummy Netherlands Casino', 'city' => 'Breda'],
            ['name' => 'Dummy Eindhoven', 'partner' => 'Dummy Holland Casino', 'jurisdiction' => 'Dummy Netherlands Casino', 'city' => 'Eindhoven'],
            ['name' => 'Dummy Groningen', 'partner' => 'Dummy Holland Casino', 'jurisdiction' => 'Dummy Netherlands Casino', 'city' => 'Groningen'],
            ['name' => 'Dummy Nijmegen', 'partner' => 'Dummy Holland Casino', 'jurisdiction' => 'Dummy Netherlands Casino', 'city' => 'Nijmegen'],
            ['name' => 'Dummy Spielbank Berlin', 'partner' => 'Dummy Spielbank Berlin', 'jurisdiction' => 'Dummy Germany', 'city' => 'Berlin'],
            ['name' => 'Dummy Merkur Duisburg', 'partner' => 'Dummy MERKUR SPIELBANKEN', 'jurisdiction' => 'Dummy Germany', 'city' => 'Duisburg'],
            ['name' => 'Dummy Merkur Hohensyburg', 'partner' => 'Dummy MERKUR SPIELBANKEN', 'jurisdiction' => 'Dummy Germany', 'city' => 'Dortmund'],
            ['name' => 'Dummy Grand Casino Baden', 'partner' => 'Dummy Grand Casino Baden', 'jurisdiction' => 'Dummy Austria', 'city' => 'Baden'],
            ['name' => 'Dummy Cirsa Madrid', 'partner' => 'Dummy Cirsa', 'jurisdiction' => 'Dummy Spain Arcade', 'city' => 'Madrid'],
            ['name' => 'Dummy Luckia Barcelona', 'partner' => 'Dummy Luckia', 'jurisdiction' => 'Dummy Spain Arcade', 'city' => 'Barcelona'],
            ['name' => 'Dummy Cirsa Seville', 'partner' => 'Dummy Cirsa', 'jurisdiction' => 'Dummy Spain Andalusia', 'city' => 'Seville'],
            ['name' => 'Dummy Caliente Bogotá', 'partner' => 'Dummy Grupo Caliente', 'jurisdiction' => 'Dummy Colombia', 'city' => 'Bogotá'],
            ['name' => 'Dummy Admiral Vienna', 'partner' => 'Dummy Admiral', 'jurisdiction' => 'Dummy Austria', 'city' => 'Vienna'],
            ['name' => 'Dummy Casino de Paris', 'partner' => 'Dummy Cirsa', 'jurisdiction' => 'Dummy France', 'city' => 'Paris'],
        ];

        foreach ($venues as $data) {
            $venue = Venue::query()->firstOrNew([
                'partner_ID' => $partners[$data['partner']]->ID,
                'name' => $data['name'],
            ]);
            $venue->jurisdiction()->associate($jurisdictions[$data['jurisdiction']]);
            $venue->city = $data['city'];
            $venue->active = true;
            $venue->mod_by = $editor->ID;
            $venue->save();
        }
    }
}
