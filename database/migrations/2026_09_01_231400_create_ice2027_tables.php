<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('dynamic__users') && ! Schema::hasColumn('dynamic__users', 'iceattendent2027')) {
            Schema::table('dynamic__users', function (Blueprint $table) {
                $table->boolean('iceattendent2027')->default(false);
            });
        }

        if (! Schema::hasTable('ice2027_teams')) {
            Schema::create('ice2027_teams', function (Blueprint $table) {
                $table->increments('ID');
                $table->string('name', 80);
                $table->unsignedInteger('created_by')->nullable();
                $table->dateTime('created_at')->useCurrent();
                $table->foreign('created_by', 'fk_ice2027_team_creator')
                    ->references('ID')
                    ->on('dynamic__users')
                    ->nullOnDelete();
            });
        }

        if (! Schema::hasTable('ice2027_team_members')) {
            Schema::create('ice2027_team_members', function (Blueprint $table) {
                $table->increments('ID');
                $table->unsignedInteger('team_ID');
                $table->unsignedInteger('user_ID');
                $table->unique('user_ID', 'uq_ice2027_member_user');
                $table->index('team_ID', 'idx_ice2027_member_team');
                $table->foreign('team_ID', 'fk_ice2027_member_team')
                    ->references('ID')
                    ->on('ice2027_teams')
                    ->cascadeOnDelete();
                $table->foreign('user_ID', 'fk_ice2027_member_user')
                    ->references('ID')
                    ->on('dynamic__users')
                    ->cascadeOnDelete();
            });
        }

        if (! Schema::hasTable('ice2027_competitors')) {
            Schema::create('ice2027_competitors', function (Blueprint $table) {
                $table->increments('ID');
                $table->string('name', 150);
                $table->unsignedInteger('team_ID')->nullable();
                $table->unsignedInteger('created_by')->nullable();
                $table->dateTime('created_at')->useCurrent();
                $table->index('team_ID', 'idx_ice2027_competitor_team');
                $table->foreign('team_ID', 'fk_ice2027_competitor_team')
                    ->references('ID')
                    ->on('ice2027_teams')
                    ->nullOnDelete();
                $table->foreign('created_by', 'fk_ice2027_competitor_creator')
                    ->references('ID')
                    ->on('dynamic__users')
                    ->nullOnDelete();
            });
        }

        if (! Schema::hasTable('ice2027_games')) {
            Schema::create('ice2027_games', function (Blueprint $table) {
                $table->increments('ID');
                $table->unsignedInteger('competitor_ID');
                $table->string('name', 150);
                $table->string('game_type', 32)->nullable();
                $table->unsignedInteger('created_by')->nullable();
                $table->dateTime('created_at')->useCurrent();
                $table->index('competitor_ID', 'idx_ice2027_game_competitor');
                $table->foreign('competitor_ID', 'fk_ice2027_game_competitor')
                    ->references('ID')
                    ->on('ice2027_competitors')
                    ->cascadeOnDelete();
                $table->foreign('created_by', 'fk_ice2027_game_creator')
                    ->references('ID')
                    ->on('dynamic__users')
                    ->nullOnDelete();
            });
        }

        if (! Schema::hasTable('ice2027_questionnaires')) {
            Schema::create('ice2027_questionnaires', function (Blueprint $table) {
                $table->increments('ID');
                $table->unsignedInteger('user_ID');
                $table->unsignedInteger('competitor_ID');
                $table->longText('payload');
                $table->dateTime('submitted_at')->useCurrent();
                $table->unique(['user_ID', 'competitor_ID'], 'uq_ice2027_questionnaire');
                $table->foreign('user_ID', 'fk_ice2027_q_user')
                    ->references('ID')
                    ->on('dynamic__users')
                    ->cascadeOnDelete();
                $table->foreign('competitor_ID', 'fk_ice2027_q_competitor')
                    ->references('ID')
                    ->on('ice2027_competitors')
                    ->cascadeOnDelete();
            });
        }

        if (! Schema::hasTable('ice2027_evaluations')) {
            Schema::create('ice2027_evaluations', function (Blueprint $table) {
                $table->increments('ID');
                $table->unsignedInteger('user_ID');
                $table->longText('payload');
                $table->dateTime('submitted_at')->useCurrent();
                $table->unique('user_ID', 'uq_ice2027_evaluation_user');
                $table->foreign('user_ID', 'fk_ice2027_e_user')
                    ->references('ID')
                    ->on('dynamic__users')
                    ->cascadeOnDelete();
            });
        }

        if ((int) DB::table('ice2027_teams')->count() === 0) {
            $now = now();
            foreach (['Team A', 'Team B', 'Team C', 'Team D', 'Team E'] as $name) {
                DB::table('ice2027_teams')->insert([
                    'name' => $name,
                    'created_by' => null,
                    'created_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ice2027_evaluations');
        Schema::dropIfExists('ice2027_questionnaires');
        Schema::dropIfExists('ice2027_games');
        Schema::dropIfExists('ice2027_competitors');
        Schema::dropIfExists('ice2027_team_members');
        Schema::dropIfExists('ice2027_teams');

        if (Schema::hasTable('dynamic__users') && Schema::hasColumn('dynamic__users', 'iceattendent2027')) {
            Schema::table('dynamic__users', function (Blueprint $table) {
                $table->dropColumn('iceattendent2027');
            });
        }
    }
};
