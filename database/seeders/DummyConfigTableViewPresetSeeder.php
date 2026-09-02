<?php

namespace Database\Seeders;

use App\Models\ConfigTable;
use App\Models\ConfigTableViewPreset;
use Illuminate\Database\Seeder;

class DummyConfigTableViewPresetSeeder extends Seeder
{
    public function run(): void
    {
        $presets = [
            [400, 'Dummy by Name', 'sc=name_english&sm=ASC&vc-flag=1&vc-iso3166=1&vc-segment=1&vc-name_english=1'],
            [400, 'Dummy by ISO-3166', 'sc=iso3166&sm=ASC'],
            [200, 'Dummy by Code', 'sc=code&sm=ASC'],
            [800, 'Dummy by Name', 'sc=name&sm=ASC'],
            [820, 'Dummy by Name', 'sc=name&sm=ASC'],
            [801, 'Dummy by Jurisdiction, then Person', 'sc=jurisdiction_ID&sm=ASC&sc2=person_ID&sm2=ASC'],
            [100, 'Dummy by recency', 'sc=ID&sm=DESC'],
        ];

        foreach ($presets as [$tableId, $name, $parameters]) {
            ConfigTable::query()->findOrFail($tableId);

            $preset = ConfigTableViewPreset::query()->firstOrNew([
                'table_ID' => $tableId,
                'name' => $name,
            ]);
            $preset->parameters = $parameters;
            $preset->save();
        }
    }
}
