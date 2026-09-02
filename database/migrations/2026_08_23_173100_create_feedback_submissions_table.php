<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback_submissions', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('mod_by');
            $table->string('submitter_name', 150);
            $table->string('submitter_email', 150);
            $table->string('department', 80);
            $table->string('feedback_type', 60);
            $table->string('related_area', 150)->nullable();
            $table->string('subject', 200);
            $table->text('description');
            $table->text('expected_impact')->nullable();
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->string('attachment_path', 255)->nullable();
            $table->enum('status', ['new', 'under_review', 'planned', 'in_progress', 'completed', 'declined'])->default('new');
            $table->dateTime('submitted_at')->useCurrent();
            $table->dateTime('reviewed_at')->nullable();
            $table->integer('reviewed_by')->nullable();
            $table->index('department', 'idx_department');
            $table->index('status', 'idx_status');
            $table->index('submitted_at', 'idx_submitted_at');
            $table->index('mod_by', 'mod_by');
            $table->foreign('mod_by', 'feedback_submissions_ibfk_1')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback_submissions');
    }
};
