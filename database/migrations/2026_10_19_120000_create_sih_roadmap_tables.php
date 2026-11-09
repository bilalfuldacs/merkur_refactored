<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sih_roadmap_milestones', function (Blueprint $table) {
            $table->increments('ID');
            $table->string('title', 160);
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('quarter');
            $table->string('status', 16)->default('planned');
            $table->boolean('is_hidden')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->unsignedInteger('created_by');
            $table->unsignedInteger('mod_by');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->index(['year', 'quarter', 'is_hidden'], 'idx_sih_roadmap_period');
            $table->foreign('created_by', 'fk_sih_roadmap_created_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('mod_by', 'fk_sih_roadmap_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });

        Schema::create('sih_roadmap_links', function (Blueprint $table) {
            $table->increments('ID');
            $table->unsignedInteger('milestone_ID');
            $table->string('label', 120);
            $table->string('url', 500);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->index('milestone_ID', 'idx_sih_roadmap_link_milestone');
            $table->foreign('milestone_ID', 'fk_sih_roadmap_link_milestone')
                ->references('ID')
                ->on('sih_roadmap_milestones')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });

        Schema::create('sih_roadmap_comments', function (Blueprint $table) {
            $table->increments('ID');
            $table->unsignedInteger('milestone_ID');
            $table->text('body');
            $table->unsignedInteger('mod_by');
            $table->timestamp('mod_date')->useCurrent();
            $table->index('milestone_ID', 'idx_sih_roadmap_comment_milestone');
            $table->foreign('milestone_ID', 'fk_sih_roadmap_comment_milestone')
                ->references('ID')
                ->on('sih_roadmap_milestones')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->foreign('mod_by', 'fk_sih_roadmap_comment_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });

        Schema::create('sih_roadmap_attachments', function (Blueprint $table) {
            $table->increments('ID');
            $table->unsignedInteger('milestone_ID');
            $table->string('original_name', 255);
            $table->string('stored_name', 80);
            $table->string('mime', 120);
            $table->unsignedInteger('size');
            $table->unsignedInteger('mod_by');
            $table->timestamp('mod_date')->useCurrent();
            $table->index('milestone_ID', 'idx_sih_roadmap_file_milestone');
            $table->foreign('milestone_ID', 'fk_sih_roadmap_file_milestone')
                ->references('ID')
                ->on('sih_roadmap_milestones')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->foreign('mod_by', 'fk_sih_roadmap_file_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });

        app(\App\Services\SihRoadmapService::class)->seedIfEmpty();
    }

    public function down(): void
    {
        Schema::dropIfExists('sih_roadmap_attachments');
        Schema::dropIfExists('sih_roadmap_comments');
        Schema::dropIfExists('sih_roadmap_links');
        Schema::dropIfExists('sih_roadmap_milestones');
    }
};
