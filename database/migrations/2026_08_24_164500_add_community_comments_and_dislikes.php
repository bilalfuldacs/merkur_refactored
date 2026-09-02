<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dynamic__posts', function (Blueprint $table) {
            $table->unsignedInteger('num_dislikes')->default(0)->after('num_likes');
            $table->unsignedInteger('num_comments')->default(0)->after('num_replies');
        });

        Schema::create('dynamic__comments', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('post_ID');
            $table->unsignedInteger('parent_ID')->nullable();
            $table->text('note');
            $table->index('mod_by', 'comments_mod_by');
            $table->index('post_ID', 'comments_post');
            $table->index('parent_ID', 'comments_parent');
            $table->foreign('mod_by', 'fk_comments_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('post_ID', 'fk_comments_post')
                ->references('ID')
                ->on('dynamic__posts')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->foreign('parent_ID', 'fk_comments_parent')
                ->references('ID')
                ->on('dynamic__comments')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });

        Schema::create('dynamic__dislikes', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('post_ID');
            $table->boolean('active');
            $table->unique(['mod_by', 'post_ID'], 'dislikes_mod_by-post');
            $table->index('post_ID', 'dislikes_post');
            $table->foreign('mod_by', 'fk_dislikes_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('post_ID', 'fk_dislikes_post')
                ->references('ID')
                ->on('dynamic__posts')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });

        $replyIds = DB::table('dynamic__posts')->whereNotNull('parent_ID')->pluck('ID');

        DB::statement(<<<'SQL'
INSERT INTO dynamic__comments (mod_date, mod_by, post_ID, note)
SELECT mod_date, mod_by, parent_ID, note
FROM dynamic__posts
WHERE parent_ID IS NOT NULL
SQL);

        if ($replyIds->isNotEmpty()) {
            DB::table('dynamic__likes')->whereIn('post_ID', $replyIds)->delete();
            DB::table('dynamic__bookmarks')->whereIn('post_ID', $replyIds)->delete();
            DB::table('dynamic__posts')->whereIn('ID', $replyIds)->delete();
        }

        $commentCounts = DB::table('dynamic__comments')
            ->select('post_ID', DB::raw('COUNT(*) as total'))
            ->groupBy('post_ID')
            ->get();

        foreach ($commentCounts as $row) {
            DB::table('dynamic__posts')->where('ID', $row->post_ID)->update([
                'num_comments' => $row->total,
                'num_replies' => $row->total,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('dynamic__dislikes');
        Schema::dropIfExists('dynamic__comments');

        Schema::table('dynamic__posts', function (Blueprint $table) {
            $table->dropColumn(['num_dislikes', 'num_comments']);
        });
    }
};
