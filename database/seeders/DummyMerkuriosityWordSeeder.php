<?php

namespace Database\Seeders;

use App\Models\MerkuriosityWord;
use Illuminate\Database\Seeder;

class DummyMerkuriosityWordSeeder extends Seeder
{
    public function run(): void
    {
        $words = [
            'slots', 'reels', 'bonus', 'chips', 'stake',
            'spins', 'wheel', 'poker', 'bingo', 'token',
        ];

        foreach ($words as $word) {
            MerkuriosityWord::query()->firstOrCreate(['word' => $word]);
        }
    }
}
