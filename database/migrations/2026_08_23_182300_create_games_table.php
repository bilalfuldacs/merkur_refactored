<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('concept_ID');
            $table->unsignedInteger('platform_ID');
            $table->unsignedInteger('resolution_ID')->nullable();
            $table->char('ID_text', 30)->charset('utf8mb4')->collation('utf8mb4_bin');
            $table->unsignedInteger('pm_owner_ID')->nullable();
            $table->string('video_URL', 250)->nullable();
            $table->text('notes')->nullable();
            $table->unsignedInteger('version_from_ID')->nullable();
            $table->unsignedInteger('status_ID')->nullable();
            $table->enum('estimated_effort', [
                'low <2500h',
                'medium ≥2500h <5000h',
                'high ≥5000h <7500h',
                'very high ≥7500h',
            ])->nullable();
            $table->boolean('in_roadmap_g')->default(false);
            $table->boolean('gli11')->nullable();
            $table->string('volatility', 10)->nullable();
            $table->string('lines', 40)->nullable();
            $table->string('reels', 40)->nullable();
            $table->string('max_bet', 15)->nullable();
            $table->string('rtps', 100)->nullable();
            $table->enum('progressive_type', [
                'Symbol Driven',
                'Mystery',
                'Symbol Driven & Mystery',
                'N/A',
            ])->nullable();
            $table->boolean('cash_on_reels')->nullable();
            $table->boolean('hold_and_spin')->nullable();
            $table->unsignedInteger('num_PP_pots')->nullable();
            $table->enum('true_persistence', ['none', '<10', '10…49', '≥50'])->nullable();
            $table->boolean('feature_in_feature')->nullable();
            $table->string('prob_of_highest_win', 200)->nullable();
            $table->string('top_award_base', 15)->nullable();
            $table->string('top_award_feature', 15)->nullable();
            $table->text('game_rules')->nullable();
            $table->boolean('supports_signage')->nullable();
            $table->enum('engine', ['proprietary', 'Godot', 'Unity'])->nullable();
            $table->unsignedInteger('version_removed_ID')->nullable();
            $table->string('dev_URL', 250)->nullable();
            $table->longText('attributes')->nullable();
            $table->unique(['concept_ID', 'platform_ID', 'resolution_ID'], 'conecpt-platform-resolution');
            $table->index('resolution_ID', 'resolution');
            $table->index('version_removed_ID', 'version_removed');
            $table->index('mod_by', 'mod_by');
            $table->index('platform_ID', 'platform');
            $table->index(['version_from_ID', 'platform_ID'], 'version_from-platform');
            $table->index('pm_owner_ID', 'fk_games_pm_owner');
            $table->index('status_ID', 'fk_games_status');
            $table->fullText('game_rules', 'game_rules');
            $table->fullText('attributes', 'extras');
            $table->foreign('mod_by', 'fk_games_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('concept_ID', 'fk_games_game_concept')
                ->references('ID')
                ->on('game_concepts')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('platform_ID', 'fk_games_platform')
                ->references('ID')
                ->on('platforms')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('pm_owner_ID', 'fk_games_pm_owner')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('resolution_ID', 'fk_games_resolution')
                ->references('ID')
                ->on('resolutions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('status_ID', 'fk_games_status')
                ->references('ID')
                ->on('config__statuses')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign(['version_from_ID', 'platform_ID'], 'fk_games_version_from_platform')
                ->references(['ID', 'platform_ID'])
                ->on('versions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('version_removed_ID', 'fk_games_version_removed')
                ->references('ID')
                ->on('versions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
