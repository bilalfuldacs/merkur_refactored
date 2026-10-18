<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('venues') && ! Schema::hasColumn('venues', 'total_machines')) {
            Schema::table('venues', function (Blueprint $table) {
                $table->unsignedInteger('total_machines')->nullable();
            });
        }

        if (
            Schema::hasTable('venues')
            && Schema::hasColumn('venues', 'total_machines')
            && Schema::getConnection()->getDriverName() === 'mysql'
        ) {
            DB::statement("ALTER TABLE venues MODIFY total_machines INT UNSIGNED NULL COMMENT '[Total number of machines at this venue]' AFTER location");
        }

        if (! Schema::hasTable('field_trial_games')) {
            Schema::create('field_trial_games', function (Blueprint $table) {
                $table->increments('ID');
                $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
                $table->unsignedInteger('mod_by');
                $table->unsignedInteger('venue_ID');
                $table->unsignedInteger('concept_ID');
                $table->unsignedInteger('game_ID');
                $table->unsignedInteger('cabinet_ID')->nullable();
                $table->unsignedInteger('machine_count')->nullable();
                $table->date('trial_date')->nullable();
                $table->string('general_status', 80)->nullable();
                $table->text('status_update')->nullable();
                $table->string('mars_status', 80)->nullable();
                $table->text('mars_status_update')->nullable();
                $table->text('info_data')->nullable();
                $table->text('remarks')->nullable();
                $table->index('venue_ID', 'idx_ftg_venue');
                $table->index('game_ID', 'idx_ftg_game');
                $table->index('concept_ID', 'idx_ftg_concept');
                $table->index('trial_date', 'idx_ftg_date');
                $table->foreign('mod_by', 'fk_ftg_mod_by')
                    ->references('ID')
                    ->on('dynamic__users')
                    ->cascadeOnUpdate()
                    ->restrictOnDelete();
                $table->foreign('venue_ID', 'fk_ftg_venue')
                    ->references('ID')
                    ->on('venues')
                    ->cascadeOnUpdate()
                    ->restrictOnDelete();
                $table->foreign('concept_ID', 'fk_ftg_concept')
                    ->references('ID')
                    ->on('game_concepts')
                    ->cascadeOnUpdate()
                    ->restrictOnDelete();
                $table->foreign('game_ID', 'fk_ftg_game')
                    ->references('ID')
                    ->on('games')
                    ->cascadeOnUpdate()
                    ->restrictOnDelete();
                $table->foreign('cabinet_ID', 'fk_ftg_cabinet')
                    ->references('ID')
                    ->on('cabinets')
                    ->cascadeOnUpdate()
                    ->restrictOnDelete();
            });
        }

        if (! Schema::hasTable('field_trial_games_history')) {
            Schema::create('field_trial_games_history', function (Blueprint $table) {
                $table->increments('revision');
                $table->enum('action', ['insert', 'update', 'delete'])->default('insert');
                $table->unsignedInteger('ID');
                $table->timestamp('mod_date')->nullable();
                $table->unsignedInteger('mod_by')->nullable();
                $table->unsignedInteger('venue_ID')->nullable();
                $table->unsignedInteger('concept_ID')->nullable();
                $table->unsignedInteger('game_ID')->nullable();
                $table->unsignedInteger('cabinet_ID')->nullable();
                $table->unsignedInteger('machine_count')->nullable();
                $table->date('trial_date')->nullable();
                $table->string('general_status', 80)->nullable();
                $table->text('status_update')->nullable();
                $table->string('mars_status', 80)->nullable();
                $table->text('mars_status_update')->nullable();
                $table->text('info_data')->nullable();
                $table->text('remarks')->nullable();
                $table->index('ID', 'idx_ftg_history_game');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('field_trial_games_history');
        Schema::dropIfExists('field_trial_games');
        if (Schema::hasTable('venues') && Schema::hasColumn('venues', 'total_machines')) {
            Schema::table('venues', function (Blueprint $table) {
                $table->dropColumn('total_machines');
            });
        }
    }
};
