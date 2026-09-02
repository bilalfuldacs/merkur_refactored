<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('focus_groups', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('version_ID');
            $table->unsignedInteger('jurisdiction_ID');
            $table->date('start_date')->nullable();
            $table->string('video_URL', 250)->nullable();
            $table->text('test_comment')->nullable();
            $table->text('ramifications')->nullable();
            $table->index('jurisdiction_ID', 'jurisdiction');
            $table->index('mod_by', 'mod_by');
            $table->index('version_ID', 'version');
            $table->foreign('mod_by', 'fk_focus_groups_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('version_ID', 'fk_focus_groups_version')
                ->references('ID')
                ->on('versions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('jurisdiction_ID', 'fk_focus_groups_jurisdiction')
                ->references('ID')
                ->on('jurisdictions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('focus_groups');
    }
};
