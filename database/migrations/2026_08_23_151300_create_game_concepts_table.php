<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_concepts', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->string('name', 50)->unique();
            $table->unsignedInteger('studio_ID');
            $table->unsignedInteger('3rd_party')->nullable();
            $table->unsignedInteger('variant_of_concept_ID')->nullable();
            $table->string('theme', 40)->nullable();
            $table->enum('portfolio_strategy', [
                'Competitive Response',
                'Evolution of Proprietary Game',
                'New',
                'Cross Leveraging Success',
            ])->nullable();
            $table->unsignedInteger('pry_design_target_mkt')->nullable();
            $table->text('base_game_USP')->nullable();
            $table->text('feature_game_USP')->nullable();
            $table->boolean('IP_licensed')->nullable();
            $table->boolean('trademarked_EU')->nullable();
            $table->boolean('trademarked_UK')->nullable();
            $table->boolean('trademarked_US')->nullable();
            $table->boolean('trademarked_CA')->nullable();
            $table->boolean('trademarked_AU-NZ')->nullable();
            $table->index('studio_ID', 'studio');
            $table->index('mod_by', 'mod_by');
            $table->index('variant_of_concept_ID', 'variant_of_game');
            $table->index('3rd_party', 'fk_game_concepts_3rd_party');
            $table->fullText('base_game_USP', 'marketing_blurb');
            $table->foreign('mod_by', 'fk_game_concepts_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('studio_ID', 'fk_game_concepts_studio')
                ->references('ID')
                ->on('teams')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('3rd_party', 'fk_game_concepts_3rd_party')
                ->references('ID')
                ->on('teams')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('variant_of_concept_ID', 'fk_game_concepts_variant_of_game')
                ->references('ID')
                ->on('game_concepts')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_concepts');
    }
};
