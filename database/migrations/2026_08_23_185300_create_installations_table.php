<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('installations', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('version_ID');
            $table->unsignedInteger('jurisdiction_ID');
            $table->unsignedInteger('venue_ID')->nullable();
            $table->date('first_install_date')->nullable();
            $table->unsignedInteger('live')->nullable();
            $table->unsignedInteger('test')->nullable();
            $table->unsignedInteger('planned')->nullable();
            $table->unsignedTinyInteger('perf_rating')->nullable();
            $table->enum('tech_rating', ['red', 'yellow', 'green'])->nullable();
            $table->string('BI_URL', 250)->nullable();
            $table->string('video_URL', 250)->nullable();
            $table->enum('first_install_type', ['new', 'conversion'])->nullable();
            $table->string('rtp', 10)->nullable();
            $table->text('test_comment')->nullable();
            $table->text('planned_comment')->nullable();
            $table->text('removal_comment')->nullable();
            $table->date('removal_date')->nullable();
            $table->unique(['version_ID', 'venue_ID'], 'version-venue');
            $table->index('jurisdiction_ID', 'jurisdiction');
            $table->index('mod_by', 'mod_by');
            $table->index('venue_ID', 'venue');
            $table->foreign('mod_by', 'fk_installations_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('version_ID', 'fk_installations_version')
                ->references('ID')
                ->on('versions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('jurisdiction_ID', 'fk_installations_jurisdiction')
                ->references('ID')
                ->on('jurisdictions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('venue_ID', 'fk_installations_venue')
                ->references('ID')
                ->on('venues')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('installations');
    }
};
