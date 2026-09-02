<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('build_milestones', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('build_ID');
            $table->unsignedInteger('expected_status_ID');
            $table->date('expected_date');
            $table->date('actual_date')->nullable();
            $table->string('comment', 140)->nullable();
            $table->index('build_ID', 'build');
            $table->index('expected_status_ID', 'expected_status');
            $table->index('expected_date', 'expected_date');
            $table->index('mod_by', 'mod_by');
            $table->index('actual_date', 'actual_date');
            $table->foreign('mod_by', 'fk_build_milestones_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('build_ID', 'fk_build_milestones_build')
                ->references('ID')
                ->on('builds')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('expected_status_ID', 'fk_build_milestones_expected_status')
                ->references('ID')
                ->on('config__statuses')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('build_milestones');
    }
};
