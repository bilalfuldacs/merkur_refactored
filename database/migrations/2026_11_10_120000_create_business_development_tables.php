<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bd_regions')) {
            Schema::create('bd_regions', function (Blueprint $table) {
                $table->unsignedTinyInteger('ID')->primary();
                $table->string('code', 12);
                $table->string('name', 80);
                $table->unsignedTinyInteger('sort_order');
                $table->unique('code', 'uq_bd_regions_code');
            });
        }

        if (! Schema::hasTable('bd_segments')) {
            Schema::create('bd_segments', function (Blueprint $table) {
                $table->unsignedTinyInteger('ID')->primary();
                $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
                $table->unsignedInteger('mod_by')->default(1);
                $table->string('name', 80);
                $table->unsignedTinyInteger('sort_order');
                $table->unique('name', 'uq_bd_segments_name');
                $table->foreign('mod_by', 'fk_bd_segments_mod_by')
                    ->references('ID')
                    ->on('dynamic__users')
                    ->cascadeOnUpdate();
            });
        }

        if (! Schema::hasTable('bd_markets')) {
            Schema::create('bd_markets', function (Blueprint $table) {
                $table->unsignedSmallInteger('ID')->primary();
                $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
                $table->unsignedInteger('mod_by')->default(1);
                $table->string('name', 120);
                $table->unsignedTinyInteger('region_ID')->comment('@bd_regions.name');
                $table->enum('status', ['merkur', 'open', 'watch', 'nogo']);
                $table->unique('name', 'uq_bd_markets_name');
                $table->index('region_ID', 'idx_bd_markets_region');
                $table->index('status', 'idx_bd_markets_status');
                $table->foreign('region_ID', 'fk_bd_markets_region')
                    ->references('ID')
                    ->on('bd_regions')
                    ->cascadeOnUpdate();
                $table->foreign('mod_by', 'fk_bd_markets_mod_by')
                    ->references('ID')
                    ->on('dynamic__users')
                    ->cascadeOnUpdate();
            });
        }

        if (! Schema::hasTable('bd_market_segments')) {
            Schema::create('bd_market_segments', function (Blueprint $table) {
                $table->unsignedSmallInteger('market_ID');
                $table->unsignedTinyInteger('segment_ID');
                $table->enum('presence', ['present', 'limited', 'planned', 'absent']);
                $table->primary(['market_ID', 'segment_ID']);
                $table->index('segment_ID', 'idx_bd_ms_segment');
                $table->foreign('market_ID', 'fk_bd_ms_market')
                    ->references('ID')
                    ->on('bd_markets')
                    ->cascadeOnUpdate()
                    ->cascadeOnDelete();
                $table->foreign('segment_ID', 'fk_bd_ms_segment')
                    ->references('ID')
                    ->on('bd_segments')
                    ->cascadeOnUpdate();
            });
        }

        if (! Schema::hasTable('bd_market_jurisdictions')) {
            Schema::create('bd_market_jurisdictions', function (Blueprint $table) {
                $table->unsignedSmallInteger('market_ID');
                $table->unsignedInteger('jurisdiction_ID')->primary()->comment('@jurisdictions.name_english');
                $table->index('market_ID', 'idx_bd_mj_market');
                $table->foreign('market_ID', 'fk_bd_mj_market')
                    ->references('ID')
                    ->on('bd_markets')
                    ->cascadeOnUpdate()
                    ->cascadeOnDelete();
                $table->foreign('jurisdiction_ID', 'fk_bd_mj_jurisdiction')
                    ->references('ID')
                    ->on('jurisdictions')
                    ->cascadeOnUpdate()
                    ->cascadeOnDelete();
            });
        }

        $seed = database_path('sql/business_development_seed.sql');
        if (is_readable($seed)) {
            // CREATE IF NOT EXISTS + regions/segments upsert; markets/links only while empty.
            DB::unprepared((string) file_get_contents($seed));
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bd_market_jurisdictions');
        Schema::dropIfExists('bd_market_segments');
        Schema::dropIfExists('bd_markets');
        Schema::dropIfExists('bd_segments');
        Schema::dropIfExists('bd_regions');
    }
};
