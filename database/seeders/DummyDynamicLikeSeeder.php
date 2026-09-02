<?php

namespace Database\Seeders;

use App\Models\DynamicLike;
use App\Models\DynamicPost;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyDynamicLikeSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $editor = User::query()->where('username', 'editor@dummy.test')->firstOrFail();

        $hello = DynamicPost::query()
            ->where('note', 'Dummy: Hello, World — the Laravel flow is now live.')
            ->firstOrFail();
        $reply = DynamicPost::query()
            ->where('note', 'Dummy: Nice start. Catalog and lookups are in place.')
            ->firstOrFail();

        $pairs = [
            [$editor, $hello],
            [$admin, $reply],
        ];

        foreach ($pairs as [$user, $post]) {
            $like = DynamicLike::query()->firstOrNew([
                'mod_by' => $user->ID,
                'post_ID' => $post->ID,
            ]);
            $like->active = true;
            $like->mod_by = $user->ID;
            $like->save();
        }

        foreach (DynamicPost::query()->get() as $post) {
            $post->num_likes = $post->likes()->where('active', true)->count();
            $post->save();
        }
    }
}
