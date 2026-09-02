<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_reuses', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('original_game_port_ID');
            $table->unsignedInteger('version_from_ID');
            $table->unsignedInteger('version_removed_ID')->nullable();
            $table->unique(['original_game_port_ID', 'version_from_ID'], 'original_game-version_from');
            $table->index('mod_by', 'mod_by');
            $table->index('version_from_ID', 'version_from');
            $table->index('version_removed_ID', 'version_removed');
            $table->foreign('mod_by', 'fk_game_reuses_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('original_game_port_ID', 'fk_game_reuses_original_game')
                ->references('ID')
                ->on('games')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('version_from_ID', 'fk_game_reuses_version_from')
                ->references('ID')
                ->on('versions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('version_removed_ID', 'fk_game_reuses_version_removed')
                ->references('ID')
                ->on('versions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_reuses');
    }
};
