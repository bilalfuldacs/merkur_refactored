<?php

namespace Database\Seeders;

use App\Models\Authority;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyAuthoritySeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();

        $authorities = [
            ['name' => 'Dummy Kansspelautoriteit', 'website' => 'https://kansspelautoriteit.nl'],
            ['name' => 'Dummy GGL', 'website' => 'https://www.ggl.de'],
            ['name' => 'Dummy Coljuegos', 'website' => 'https://coljuegos.gov.co'],
            ['name' => 'Dummy DGOJ', 'website' => 'https://www.ordenacionjuego.es'],
            ['name' => 'Dummy ANJ', 'website' => 'https://www.anj.fr'],
        ];

        foreach ($authorities as $data) {
            $authority = Authority::query()->firstOrNew(['name' => $data['name']]);
            $authority->website = $data['website'];
            $authority->mod_by = $editor->ID;
            $authority->save();
        }
    }
}
