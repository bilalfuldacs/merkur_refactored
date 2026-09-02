<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('markets_online', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('jurisdiction_ID')->unique('jurisdiction');
            $table->enum('jurisdiction_segment', ['land-based', 'online'])->default('online');
            $table->enum('cluster', ['regular', 'focal'])->default('regular');
            $table->string('product_share', 15)->nullable();
            $table->string('product_share_merkur', 15)->nullable();
            $table->text('product_share_by_supplier')->nullable();
            $table->string('segment_split', 80)->nullable();
            $table->string('game_feature_types', 80)->nullable();
            $table->boolean('fruits')->nullable();
            $table->boolean('gems')->nullable();
            $table->boolean('bars_and_7s')->nullable();
            $table->boolean('space')->nullable();
            $table->boolean('asia')->nullable();
            $table->boolean('egypt')->nullable();
            $table->boolean('nature_and_animals')->nullable();
            $table->boolean('adventure')->nullable();
            $table->boolean('history')->nullable();
            $table->boolean('fantasy_and_mythology')->nullable();
            $table->string('seasonally_themed', 80)->nullable();
            $table->string('volatility', 80)->nullable();
            $table->string('lines', 80)->nullable();
            $table->string('denominations', 80)->nullable();
            $table->string('sound', 80)->nullable();
            $table->boolean('smartphone')->nullable();
            $table->boolean('tablet')->nullable();
            $table->boolean('notebook')->nullable();
            $table->boolean('desktop')->nullable();
            $table->string('tech_requirements', 80)->nullable();
            $table->string('age_groups', 15)->nullable();
            $table->string('sex', 7)->nullable();
            $table->string('budget', 21)->nullable();
            $table->string('spending_segments', 11)->nullable();
            $table->text('main_competitors_and_top_3_games')->nullable();
            $table->decimal('avg_bet', 10, 2)->unsigned()->nullable();
            $table->decimal('avg_bet_merkur', 10, 2)->unsigned()->nullable();
            $table->text('top_10_games')->nullable();
            $table->text('bottom_10_games')->nullable();
            $table->text('new_games')->nullable();
            $table->text('lp_all')->nullable();
            $table->text('lp_merkur')->nullable();
            $table->text('sp_all')->nullable();
            $table->text('sp_merkur')->nullable();
            $table->text('rg_all')->nullable();
            $table->text('rg_merkur')->nullable();
            $table->text('notes')->nullable();
            $table->index('mod_by', 'mod_by');
            $table->index(['jurisdiction_segment', 'jurisdiction_ID'], 'jurisdiction_segment-jurisdiction');
            $table->foreign('mod_by', 'fk_markets_online_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign(['jurisdiction_segment', 'jurisdiction_ID'], 'fk_markets_online_jdx')
                ->references(['segment', 'ID'])
                ->on('jurisdictions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('markets_online');
    }
};
