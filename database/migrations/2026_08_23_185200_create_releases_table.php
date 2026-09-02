<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('releases', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('build_ID')->nullable();
            $table->date('release_date')->nullable();
            $table->unsignedInteger('release_by');
            $table->string('GLI_approval_status', 160);
            $table->unsignedInteger('base_dongle_ID');
            $table->string('suitable_for_cabinets', 160);
            $table->string('suitable_for_markets', 160);
            $table->text('solved_issues')->nullable();
            $table->text('notes')->nullable();
            $table->unique('build_ID', 'build');
            $table->index('mod_by', 'mod_by');
            $table->index('release_by', 'release_by');
            $table->index('base_dongle_ID', 'base_dongle');
            $table->foreign('mod_by', 'fk_releases_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('release_by', 'fk_releases_release_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('build_ID', 'fk_releases_build')
                ->references('ID')
                ->on('builds')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('base_dongle_ID', 'fk_releases_base_dongle')
                ->references('ID')
                ->on('dongles')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('releases');
    }
};
