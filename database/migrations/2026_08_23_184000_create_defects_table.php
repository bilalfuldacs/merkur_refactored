<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('defects', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('version_ID')->nullable();
            $table->unsignedInteger('build_ID')->nullable();
            $table->unsignedInteger('game_ID');
            $table->string('name', 50);
            $table->text('description')->nullable();
            $table->unique(['build_ID', 'game_ID'], 'build-game');
            $table->unique(['version_ID', 'game_ID'], 'version-game');
            $table->index('mod_by', 'mod_by');
            $table->index('name', 'name');
            $table->index('game_ID', 'game');
            $table->foreign('mod_by', 'fk_defects_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('version_ID', 'fk_defects_version')
                ->references('ID')
                ->on('versions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('build_ID', 'fk_defects_build')
                ->references('ID')
                ->on('builds')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('game_ID', 'fk_defects_game')
                ->references('ID')
                ->on('games')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('defects');
    }
};
