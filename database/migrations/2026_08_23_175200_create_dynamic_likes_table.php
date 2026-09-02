<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dynamic__likes', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('post_ID')->nullable();
            $table->boolean('active');
            $table->unique(['mod_by', 'post_ID'], 'mod_by-post');
            $table->index('post_ID', 'post');
            $table->foreign('mod_by', 'fk_likes_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('post_ID', 'fk_likes_post')
                ->references('ID')
                ->on('dynamic__posts')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dynamic__likes');
    }
};
