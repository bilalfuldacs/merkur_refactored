<?php

namespace Database\Seeders;

use App\Models\DynamicPost;
use App\Models\Platform;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyDynamicPostSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $editor = User::query()->where('username', 'editor@dummy.test')->firstOrFail();
        $platform = Platform::query()->where('name', 'Dummy MII')->firstOrFail();

        $hello = DynamicPost::query()->firstOrNew([
            'mod_by' => $admin->ID,
            'note' => 'Dummy: Hello, World — the Laravel flow is now live.',
        ]);
        $hello->parent_ID = null;
        $hello->setAttribute('table', null);
        $hello->item_ID = null;
        $hello->num_replies = 0;
        $hello->num_likes = 0;
        $hello->num_bookmarks = 0;
        $hello->mod_by = $admin->ID;
        $hello->save();

        $reply = DynamicPost::query()->firstOrNew([
            'mod_by' => $editor->ID,
            'note' => 'Dummy: Nice start. Catalog and lookups are in place.',
        ]);
        $reply->parent_ID = $hello->ID;
        $reply->setAttribute('table', null);
        $reply->item_ID = null;
        $reply->mod_by = $editor->ID;
        $reply->save();

        $attached = DynamicPost::query()->firstOrNew([
            'mod_by' => $admin->ID,
            'note' => 'Dummy: Dummy MII is the first platform in this rewrite.',
        ]);
        $attached->parent_ID = null;
        $attached->setAttribute('table', 'platforms');
        $attached->item_ID = $platform->ID;
        $attached->mod_by = $admin->ID;
        $attached->save();
    }
}
