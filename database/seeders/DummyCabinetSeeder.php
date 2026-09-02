<?php

namespace Database\Seeders;

use App\Models\Cabinet;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyCabinetSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();

        $cabinets = [
            [
                'name' => 'Dummy Allegro Trio',
                'code' => 'DSTC230',
                'form_factor' => 'Slant',
                'tagline' => 'Our royal slant top cabinet',
                'blurb' => 'Let us introduce you to our royal slant top cabinet—Allegro Trio. The elegant, slim and shapely appeal is sure to catch your eye. Modern technology combined with extravagant style ensures absolute player comfort.',
            ],
            [
                'name' => 'Dummy Avante Trio',
                'code' => 'DCU230',
                'form_factor' => 'Upright',
                'tagline' => 'Our most sophisticated upright cabinet',
                'blurb' => 'With its three brilliant 27″ Full HD screens and its stylish curved exterior design, the Avante Trio marks an entirely new high standard in gaming cabinet excellence. Packed with features that will catch attention and please the eye. The Avante Trio combines style with sophistication.',
            ],
            [
                'name' => 'Dummy Avantgarde Max Trio',
                'code' => 'DGLM230',
                'form_factor' => 'Slant',
                'tagline' => 'A whole new level of gaming experience',
                'blurb' => 'Part of the extremely successful Avantgarde line, we are proud to present the brand new cabinet Avantgarde Max Trio. This outstanding cabinet with brilliant 31,5“ full HD slim displays guarantees a whole new level of gaming experience.',
            ],
            [
                'name' => 'Dummy Avantgarde Trio',
                'code' => 'DGLS110',
                'form_factor' => 'Slant',
                'tagline' => 'Curvy, elegant and modern',
                'blurb' => 'Curvy, elegant and modern—these characteristics define the new Avantgarde Trio perfectly. The Avantgarde Trio sets new high standards of integrated design and with its third high definition screen provides the opportunity to display video content and/or embedded Jackpot signage for the overall gaming experience.',
            ],
            [
                'name' => 'Dummy Evostar',
                'code' => 'DGLU100',
                'form_factor' => 'Upright',
                'tagline' => 'Dynamic modern look, absolute player comfort',
                'blurb' => 'Our innovative upright gaming machine, Evostar, offers not just a dynamic modern look and absolute player comfort—but players now also have the added facility of using the built-in USB port to charge a mobile phone during their time on the game.',
            ],
            [
                'name' => 'Dummy G-Box',
                'code' => 'DGBS200',
                'form_factor' => 'Upright',
                'tagline' => 'Ideal for bars and small arcades',
                'blurb' => 'The truly compact and robust G-Box brings together utmost quality with excellent game comfort. It is the ideal cabinet for bars and small arcades.',
            ],
            [
                'name' => 'Dummy Zonic',
                'code' => 'DSTM220',
                'form_factor' => 'Slant',
                'tagline' => 'Cabinet with interchangeable frames',
                'blurb' => 'We are proud to present you our newest cabinet: ZONIC. With its interchangeable cabinet frames ZONIC is a unique addition to our product range and can standout on any casino floor. Sleek and modern, flashy and cool or classic and elegant—what look are you going to go for?',
            ],
            [
                'name' => 'Dummy Zonic Trio',
                'code' => 'DSTM230',
                'form_factor' => 'Slant',
                'tagline' => 'Cabinet with interchangeable frames',
                'blurb' => 'We are proud to present you our newest cabinet: ZONIC. With its interchangeable cabinet frames ZONIC is a unique addition to our product range and can standout on any casino floor. Sleek and modern, flashy and cool or classic and elegant—what look are you going to go for?',
            ],
            [
                'name' => 'Dummy Avante Curved',
                'code' => 'DCU200',
                'form_factor' => 'Upright',
                'tagline' => 'Our high class upright cabinet',
                'blurb' => 'Our high class upright cabinet sparkles with its brilliant rainbow LED solution. Additional back lights behind the screen will brighten up your casino floor. Discover the benefits of this evolutionary cabinet of our curved family.',
            ],
            [
                'name' => 'Dummy Allegro Curved',
                'code' => 'DSTC200',
                'form_factor' => 'Slant',
                'tagline' => 'Where passion and fascination come together',
                'blurb' => 'Where passion and fascination come together—Allegro embodies the pure MERKUR spirit. Timeless design that incorporates clear curves ensures that players and their emotions are the center of attention.',
            ],
            [
                'name' => 'Dummy Avantgarde Max',
                'code' => 'DGLM220',
                'form_factor' => 'Slant',
                'tagline' => 'A whole new level of gaming experience',
                'blurb' => 'Part of the extremely successful Avantgarde line, we are proud to present the brand new cabinet Avantgarde Max. This outstanding cabinet with brilliant 31,5“ full HD slim displays guarantees a whole new level of gaming experience.',
            ],
            [
                'name' => 'Dummy Avantgarde',
                'code' => 'DGLS100',
                'form_factor' => 'Slant',
                'tagline' => 'Curvy, elegant and modern',
                'blurb' => 'Curvy, elegant and modern—these characteristics define the new Avantgarde perfectly. The Avantgarde sets new high standards of integrated design.',
            ],
            [
                'name' => 'Dummy Merkurstar',
                'code' => 'DCU100',
                'form_factor' => 'Upright',
                'tagline' => 'Modern design and striking lighting effects',
                'blurb' => 'The modern Merkurstar upright cabinet stands out visually thanks to its modern design and the striking lighting effects along the edges of its two 24-inch monitors. Intelligent ergonomic design features, high-resolution HD technology and excellent sound all combine to guarantee perfect entertainment.',
            ],
            [
                'name' => 'Dummy MOD EX',
                'code' => 'DUM____',
                'form_factor' => 'Slant',
                'tagline' => 'Infinite Innovation, one module at a time',
                'blurb' => 'Modular Marvel: The MOD EX boasts a modular housing system, comprising a sturdy base, sleek body, and vibrant screens.',
            ],
            [
                'name' => 'Dummy Zonic Curved',
                'code' => 'DSTM250',
                'form_factor' => 'Slant',
                'tagline' => 'STM250 with buttons / STM251 with VBP',
                'blurb' => 'Zonic Curved in two different versions. Both versions with 55" J-Curved display. STM250 comes with physical button panel. STM251 comes with video-button-panel.',
            ],
        ];

        foreach ($cabinets as $data) {
            $cabinet = Cabinet::query()->firstOrNew(['name' => $data['name']]);
            $cabinet->code = $data['code'];
            $cabinet->form_factor = $data['form_factor'];
            $cabinet->tagline = $data['tagline'];
            $cabinet->blurb = $data['blurb'];
            $cabinet->mod_by = $editor->ID;
            $cabinet->save();
        }
    }
}
