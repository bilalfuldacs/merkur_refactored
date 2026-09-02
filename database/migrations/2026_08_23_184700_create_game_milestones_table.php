<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_milestones', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('game_ID');
            $table->unsignedInteger('expected_status_ID');
            $table->date('expected_date');
            $table->date('actual_date')->nullable();
            $table->date('sort_date')->storedAs('coalesce(`actual_date`,`expected_date`)');
            $table->string('comment', 140)->nullable();
            $table->unique(['game_ID', 'expected_status_ID'], 'game-expected_status');
            $table->index('game_ID', 'game');
            $table->index('expected_status_ID', 'expected_status');
            $table->index('expected_date', 'expected_date');
            $table->index('mod_by', 'mod_by');
            $table->index('actual_date', 'actual_date');
            $table->foreign('mod_by', 'fk_game_milestones_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('game_ID', 'fk_game_milestones_game')
                ->references('ID')
                ->on('games')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('expected_status_ID', 'fk_game_milestones_expected_status')
                ->references('ID')
                ->on('config__statuses')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_milestones');
    }
};
