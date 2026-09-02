<?php

namespace Database\Seeders;

use App\Models\StratFeature;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyStratFeatureSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();

        $parent = StratFeature::query()->firstOrNew(['name' => 'Dummy Sample Feature']);
        $parent->description = 'Starting point of a dummy strategic feature hierarchy.';
        $parent->variant_of_ID = null;
        $parent->mod_by = $editor->ID;
        $parent->save();

        $variant = StratFeature::query()->firstOrNew(['name' => 'Dummy Sample Feature Plus']);
        $variant->description = 'Variant of the dummy sample feature.';
        $variant->variantOf()->associate($parent);
        $variant->mod_by = $editor->ID;
        $variant->save();
    }
}
