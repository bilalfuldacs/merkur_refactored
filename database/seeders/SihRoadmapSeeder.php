<?php

namespace Database\Seeders;

use App\Services\SihRoadmapService;
use Illuminate\Database\Seeder;

class SihRoadmapSeeder extends Seeder
{
    public function run(): void
    {
        app(SihRoadmapService::class)->seedIfEmpty();
    }
}
