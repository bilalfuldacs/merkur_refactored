<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('markets_landbased', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('jurisdiction_ID')->unique('jurisdiction');
            $table->enum('jurisdiction_segment', ['land-based', 'online', 'online ⭐'])->default('land-based');
            $table->enum('cluster', ['regular', 'focal'])->default('regular');
            $table->json('metadata')->nullable();
            $table->unsignedInteger('total_#_of_venues')->nullable();
            $table->unsignedInteger('total_#_of_EGMs')->nullable();
            $table->unsignedInteger('#_of_MERKUR_EGMs')->nullable();
            $table->integer('total_market_revenue')->nullable();
            $table->decimal('share_growth', 5, 1)->nullable();
            $table->string('ASP_per_machine', 50)->nullable();
            $table->string('replacement_rate', 50)->nullable();
            $table->integer('openness_to_switch')->nullable();
            $table->integer('target_win_rate')->nullable();
            $table->json('top_competitors')->nullable();
            $table->json('SWOT_competitors')->nullable();
            $table->json('top_games')->nullable();
            $table->text('top_games_comment')->nullable();
            $table->json('game_types')->nullable();
            $table->text('game_types_comment')->nullable();
            $table->string('volatility', 80)->nullable();
            $table->string('lines', 40)->nullable();
            $table->string('reel_grid', 40)->nullable();
            $table->string('bet_levels-denoms', 120)->nullable();
            $table->string('RTP', 80)->nullable();
            $table->text('progressive_jackpots')->nullable();
            $table->text('bonus_features')->nullable();
            $table->text('feature_triggers')->nullable();
            $table->boolean('volatility_mode_selection')->nullable();
            $table->string('adaptive_gameplay', 40)->nullable();
            $table->string('hit_frequency', 80)->nullable();
            $table->string('win_distribution', 80)->nullable();
            $table->string('bonus_frequency', 80)->nullable();
            $table->string('avg_bonus_win', 80)->nullable();
            $table->string('max_win', 80)->nullable();
            $table->text('pay_table_math')->nullable();
            $table->string('prog_seed-contrib', 40)->nullable();
            $table->string('game_cycle', 80)->nullable();
            $table->string('hit_to_feature_ratio', 80)->nullable();
            $table->string('std_deviation', 80)->nullable();
            $table->json('top_cabinets')->nullable();
            $table->string('core_games', 40)->nullable();
            $table->string('preferred_CG', 60)->nullable();
            $table->string('premium_games', 40)->nullable();
            $table->string('preferred_PG', 60)->nullable();
            $table->string('avg_selling_price', 40)->nullable();
            $table->string('revenue_share', 40)->nullable();
            $table->string('payback_period', 40)->nullable();
            $table->string('LTV', 40)->nullable();
            $table->string('PLR', 80)->nullable();
            $table->json('key_perf_metrics')->nullable();
            $table->text('key_perf_metrics_comment')->nullable();
            $table->text('demographic')->nullable();
            $table->text('socioeconomic')->nullable();
            $table->text('motivation')->nullable();
            $table->text('behavior')->nullable();
            $table->text('confidence')->nullable();
            $table->text('cultural_pref')->nullable();
            $table->text('opportunities')->nullable();
            $table->text('seasonal_factors')->nullable();
            $table->text('emerging_competitors')->nullable();
            $table->text('cntry_reg_rules')->nullable();
            $table->text('local_reg_rules')->nullable();
            $table->text('immediate')->nullable();
            $table->text('medium_term')->nullable();
            $table->text('notes')->nullable();
            $table->index('mod_by', 'mod_by');
            $table->index(['jurisdiction_segment', 'jurisdiction_ID'], 'jurisdiction_segment-jurisdiction');
            $table->foreign('mod_by', 'fk_markets_landbased_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign(['jurisdiction_segment', 'jurisdiction_ID'], 'fk_markets_landbased_jdx')
                ->references(['segment', 'ID'])
                ->on('jurisdictions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('markets_landbased');
    }
};
