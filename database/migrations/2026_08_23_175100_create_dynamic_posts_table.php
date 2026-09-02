<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dynamic__posts', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('parent_ID')->nullable();
            $table->string('table', 30)->nullable();
            $table->unsignedInteger('item_ID')->nullable();
            $table->text('note')->nullable();
            $table->unsignedInteger('num_replies')->default(0);
            $table->unsignedInteger('num_likes')->default(0);
            $table->unsignedInteger('num_bookmarks')->default(0);
            $table->index('mod_by', 'mod_by');
            $table->index(['table', 'item_ID'], 'table-item');
            $table->index('parent_ID', 'parent');
            $table->fullText('note', 'note');
            $table->foreign('mod_by', 'fk_posts_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('parent_ID', 'fk_posts_parent')
                ->references('ID')
                ->on('dynamic__posts')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dynamic__posts');
    }
};
