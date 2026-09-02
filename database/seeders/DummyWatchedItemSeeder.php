<?php

namespace Database\Seeders;

use App\Models\Platform;
use App\Models\User;
use App\Models\WatchedItem;
use Illuminate\Database\Seeder;

class DummyWatchedItemSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $platform = Platform::query()->where('name', 'Dummy MII')->firstOrFail();

        $items = [
            [
                'mod_by' => $admin->ID,
                'table' => 'platforms',
                'item_ID' => $platform->ID,
                'status' => 'watched',
            ],
            [
                'mod_by' => $admin->ID,
                'table' => 'jurisdictions',
                'item_ID' => 1,
                'status' => 'bookmarked',
            ],
        ];

        foreach ($items as $data) {
            $watch = WatchedItem::query()->firstOrNew([
                'mod_by' => $data['mod_by'],
                'table' => $data['table'],
                'item_ID' => $data['item_ID'],
            ]);
            $watch->status = $data['status'];
            $watch->mod_by = $data['mod_by'];
            $watch->save();
        }
    }
}
