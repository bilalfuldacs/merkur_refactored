<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('scout_questionnaire_drafts')) {
            return;
        }

        Schema::create('scout_questionnaire_drafts', function (Blueprint $table) {
            $table->increments('ID');
            $table->unsignedInteger('event_ID');
            $table->unsignedInteger('team_ID');
            $table->unsignedInteger('competitor_ID');
            $table->string('draft_key', 80);
            $table->longText('payload');
            $table->longText('ratings')->nullable();
            $table->unsignedInteger('updated_by');
            $table->dateTime('updated_at')->useCurrent();
            $table->unique(['event_ID', 'team_ID', 'competitor_ID', 'draft_key'], 'uq_scout_q_draft');
            $table->index('team_ID', 'idx_scout_qd_team');
            $table->foreign('event_ID', 'fk_scout_qd_event')
                ->references('ID')
                ->on('scout_events')
                ->cascadeOnDelete();
            $table->foreign('team_ID', 'fk_scout_qd_team')
                ->references('ID')
                ->on('ice2027_teams')
                ->cascadeOnDelete();
            $table->foreign('competitor_ID', 'fk_scout_qd_competitor')
                ->references('ID')
                ->on('ice2027_competitors')
                ->cascadeOnDelete();
            $table->foreign('updated_by', 'fk_scout_qd_user')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scout_questionnaire_drafts');
    }
};
