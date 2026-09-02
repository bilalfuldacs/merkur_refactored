<?php

namespace Database\Seeders;

use App\Models\Authority;
use App\Models\Jurisdiction;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyJurisdictionSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();

        $authorities = Authority::query()->pluck('ID', 'name');

        $parents = [
            [
                'name' => 'Dummy Universal',
                'name_english' => 'Dummy Universal',
                'iso3166' => '(uni)',
                'flag' => '🌍',
                'segment' => 'land-based',
                'segment_name' => '',
                'currency_name_english' => 'Euro',
                'iso4217' => 'EUR',
                'currency_symbol' => '€',
                'symbol_position' => 'postfix',
                'separators' => '123.456,78',
            ],
            [
                'name' => 'Dummy Universal Online',
                'name_english' => 'Dummy Universal Online',
                'iso3166' => '(uni)',
                'flag' => '🌍',
                'segment' => 'online',
                'segment_name' => 'Online',
                'currency_name_english' => 'Euro',
                'iso4217' => 'EUR',
                'currency_symbol' => '€',
                'symbol_position' => 'postfix',
                'separators' => '123.456,78',
            ],
            [
                'name' => 'Dummy Netherlands Casino',
                'name_english' => 'Dummy Netherlands Casino',
                'iso3166' => 'NL',
                'flag' => '🇳🇱',
                'segment' => 'land-based',
                'segment_name' => 'Casino',
                'currency_name_english' => 'Euro',
                'iso4217' => 'EUR',
                'currency_symbol' => '€',
                'symbol_position' => 'postfix',
                'separators' => '123.456,78',
                'authority' => 'Dummy Kansspelautoriteit',
                'game_languages' => 'Dutch, English',
            ],
            [
                'name' => 'Dummy Germany',
                'name_english' => 'Dummy Germany',
                'iso3166' => 'DE',
                'flag' => '🇩🇪',
                'segment' => 'land-based',
                'segment_name' => '',
                'currency_name_english' => 'Euro',
                'iso4217' => 'EUR',
                'currency_symbol' => '€',
                'symbol_position' => 'postfix',
                'separators' => '123.456,78',
                'authority' => 'Dummy GGL',
                'game_languages' => 'German',
            ],
            [
                'name' => 'Dummy Germany Online',
                'name_english' => 'Dummy Germany Online',
                'iso3166' => 'DE',
                'flag' => '🇩🇪',
                'segment' => 'online',
                'segment_name' => 'Online',
                'currency_name_english' => 'Euro',
                'iso4217' => 'EUR',
                'currency_symbol' => '€',
                'symbol_position' => 'postfix',
                'separators' => '123.456,78',
                'authority' => 'Dummy GGL',
                'game_languages' => 'German',
            ],
            [
                'name' => 'Dummy Colombia',
                'name_english' => 'Dummy Colombia',
                'iso3166' => 'CO',
                'flag' => '🇨🇴',
                'segment' => 'land-based',
                'segment_name' => '',
                'currency_name_english' => 'Colombian Peso',
                'iso4217' => 'COP',
                'currency_symbol' => '$',
                'symbol_position' => 'prefix',
                'separators' => '123,456.78',
                'authority' => 'Dummy Coljuegos',
                'game_languages' => 'Spanish',
            ],
            [
                'name' => 'Dummy Colombia Online',
                'name_english' => 'Dummy Colombia Online',
                'iso3166' => 'CO',
                'flag' => '🇨🇴',
                'segment' => 'online',
                'segment_name' => 'Online',
                'currency_name_english' => 'Colombian Peso',
                'iso4217' => 'COP',
                'currency_symbol' => '$',
                'symbol_position' => 'prefix',
                'separators' => '123,456.78',
                'authority' => 'Dummy Coljuegos',
                'game_languages' => 'Spanish',
            ],
            [
                'name' => 'Dummy Austria',
                'name_english' => 'Dummy Austria',
                'iso3166' => 'AT',
                'flag' => '🇦🇹',
                'segment' => 'land-based',
                'segment_name' => '',
                'currency_name_english' => 'Euro',
                'iso4217' => 'EUR',
                'currency_symbol' => '€',
                'symbol_position' => 'postfix',
                'separators' => '123.456,78',
                'game_languages' => 'German',
            ],
            [
                'name' => 'Dummy France',
                'name_english' => 'Dummy France',
                'iso3166' => 'FR',
                'flag' => '🇫🇷',
                'segment' => 'land-based',
                'segment_name' => '',
                'currency_name_english' => 'Euro',
                'iso4217' => 'EUR',
                'currency_symbol' => '€',
                'symbol_position' => 'postfix',
                'separators' => '123.456,78',
                'authority' => 'Dummy ANJ',
                'game_languages' => 'French',
            ],
            [
                'name' => 'Dummy Spain Arcade',
                'name_english' => 'Dummy Spain Arcade',
                'iso3166' => 'ES',
                'flag' => '🇪🇸',
                'segment' => 'land-based',
                'segment_name' => 'Arcade',
                'currency_name_english' => 'Euro',
                'iso4217' => 'EUR',
                'currency_symbol' => '€',
                'symbol_position' => 'postfix',
                'separators' => '123.456,78',
                'authority' => 'Dummy DGOJ',
                'game_languages' => 'Spanish',
            ],
            [
                'name' => 'Dummy Bulgaria',
                'name_english' => 'Dummy Bulgaria',
                'iso3166' => 'BG',
                'flag' => '🇧🇬',
                'segment' => 'land-based',
                'segment_name' => '',
                'currency_name_english' => 'Bulgarian Lev',
                'iso4217' => 'BGN',
                'currency_symbol' => 'лв',
                'symbol_position' => 'postfix',
                'separators' => '123.456,78',
                'game_languages' => 'Bulgarian',
            ],
        ];

        foreach ($parents as $data) {
            $this->saveJurisdiction($editor->ID, $data, $authorities);
        }

        $this->saveJurisdiction($editor->ID, [
            'name' => 'Dummy Spain Andalusia',
            'name_english' => 'Dummy Spain Andalusia',
            'iso3166' => 'ES-AN',
            'flag' => '🇪🇸',
            'segment' => 'land-based',
            'segment_name' => 'Arcade',
            'currency_name_english' => 'Euro',
            'iso4217' => 'EUR',
            'currency_symbol' => '€',
            'symbol_position' => 'postfix',
            'separators' => '123.456,78',
            'authority' => 'Dummy DGOJ',
            'parent' => 'Dummy Spain Arcade',
            'game_languages' => 'Spanish',
        ], $authorities);
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  \Illuminate\Support\Collection<string, int>  $authorities
     */
    private function saveJurisdiction(int $editorId, array $data, $authorities): void
    {
        $jurisdiction = Jurisdiction::query()->firstOrNew(['name_english' => $data['name_english']]);
        $jurisdiction->name = $data['name'];
        $jurisdiction->iso3166 = $data['iso3166'];
        $jurisdiction->flag = $data['flag'];
        $jurisdiction->segment = $data['segment'];
        $jurisdiction->segment_name = $data['segment_name'];
        $jurisdiction->currency_name_english = $data['currency_name_english'];
        $jurisdiction->iso4217 = $data['iso4217'];
        $jurisdiction->currency_symbol = $data['currency_symbol'];
        $jurisdiction->symbol_position = $data['symbol_position'] ?? null;
        $jurisdiction->separators = $data['separators'] ?? null;
        $jurisdiction->game_languages = $data['game_languages'] ?? null;
        $jurisdiction->authority_ID = isset($data['authority'])
            ? $authorities[$data['authority']]
            : null;
        $jurisdiction->parent_ID = isset($data['parent'])
            ? Jurisdiction::query()->where('name_english', $data['parent'])->firstOrFail()->ID
            : null;
        $jurisdiction->mod_by = $editorId;
        $jurisdiction->save();
    }
}
