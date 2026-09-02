<?php

namespace Database\Seeders;

use App\Models\ConfigTable;
use Illuminate\Database\Seeder;

class DummyConfigTableSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/data/config_tables.json');
        $rows = json_decode((string) file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);

        foreach ($rows as $data) {
            $row = ConfigTable::query()->firstOrNew(['ID' => (int) $data['ID']]);
            $row->fill($data);
            $row->save();
        }
    }
}
