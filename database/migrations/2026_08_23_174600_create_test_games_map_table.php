<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('test_games_map', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('test_ID');
            $table->unsignedInteger('game_ID');
            $table->index('mod_by', 'mod_by');
            $table->index('test_ID', 'parent');
            $table->index('game_ID', 'fk_test_game');
            $table->foreign('mod_by', 'fk_test_games_map_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('test_ID', 'fk_test_test')
                ->references('ID')
                ->on('test')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('test_games_map');
    }
};
