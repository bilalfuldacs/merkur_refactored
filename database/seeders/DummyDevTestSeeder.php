<?php

namespace Database\Seeders;

use App\Models\DevTest;
use App\Models\Platform;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyDevTestSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $platform = Platform::query()->where('name', 'Dummy MII')->firstOrFail();

        $parent = DevTest::query()->firstOrNew(['varchar_40_NOT_NULL' => 'Dummy Test Parent']);
        $parent->fill([
            'varchar_100' => 'Dummy parent row for field-type checks',
            'boolean' => true,
            'integer' => 42,
            'color' => '#ffcc00',
            'traffic_light' => 'green',
            'enum' => 'foo',
            'foreign_key_ID' => $platform->ID,
            'attributes' => ['dummy' => true],
        ]);
        $parent->setAttribute('decimal_10,_2', '12.50');
        $parent->mod_by = $editor->ID;
        $parent->save();

        $child = DevTest::query()->firstOrNew(['varchar_40_NOT_NULL' => 'Dummy Test Child']);
        $child->fill([
            'varchar_100' => 'Dummy child pointing at the parent row',
            'boolean' => false,
            'traffic_light' => 'yellow',
            'enum' => 'bar',
            'another_test_item_ID' => $parent->ID,
        ]);
        $child->mod_by = $editor->ID;
        $child->save();
    }
}
