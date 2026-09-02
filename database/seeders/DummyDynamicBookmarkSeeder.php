<?php

namespace Database\Seeders;

use App\Models\DynamicBookmark;
use App\Models\DynamicPost;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyDynamicBookmarkSeeder extends Seeder
{
    public function run(): void
    {
        $sales = User::query()->where('username', 'sales@dummy.test')->firstOrFail();
        $hello = DynamicPost::query()
            ->where('note', 'Dummy: Hello, World — the Laravel flow is now live.')
            ->firstOrFail();

        $bookmark = DynamicBookmark::query()->firstOrNew([
            'mod_by' => $sales->ID,
            'post_ID' => $hello->ID,
        ]);
        $bookmark->active = true;
        $bookmark->mod_by = $sales->ID;
        $bookmark->save();

        foreach (DynamicPost::query()->get() as $post) {
            $post->num_bookmarks = $post->bookmarks()->where('active', true)->count();
            $post->num_replies = $post->replies()->count();
            $post->save();
        }
    }
}
