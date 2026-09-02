<?php

namespace Database\Seeders;

use App\Models\Resolution;
use Illuminate\Database\Seeder;

class DummyResolutionSeeder extends Seeder
{
    public function run(): void
    {
        $resolutions = [
            ['name' => 'Dummy FHD 1920x1080', 'orientation' => 'landscape'],
            ['name' => 'Dummy UHD 2160x3840', 'orientation' => 'portrait'],
            ['name' => 'Dummy UHD 2160x3840 upscaled', 'orientation' => 'portrait'],
            ['name' => 'Dummy SD 800x600 legacy', 'orientation' => 'landscape'],
        ];

        foreach ($resolutions as $data) {
            Resolution::query()->updateOrCreate(
                ['name' => $data['name']],
                ['orientation' => $data['orientation']]
            );
        }
    }
}
