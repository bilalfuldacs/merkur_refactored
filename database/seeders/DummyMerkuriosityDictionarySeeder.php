<?php

namespace Database\Seeders;

use App\Models\MerkuriosityDictionary;
use Illuminate\Database\Seeder;

class DummyMerkuriosityDictionarySeeder extends Seeder
{
    public function run(): void
    {
        $words = [
            'dummy', 'merky', 'slots', 'reels', 'chips',
            'bonus', 'jacks', 'spins', 'coins', 'stake',
            'wheel', 'token', 'bingo', 'poker', 'flush',
            'bluff', 'dealt', 'antes', 'clubs', 'heart',
        ];

        foreach ($words as $word) {
            MerkuriosityDictionary::query()->firstOrCreate(['word' => $word]);
        }
    }
}
