<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SIH / Team Roadmap parity with the original MERKURflow board:
 *  - `status` is already a VARCHAR(16), so `paused` needs no enum alteration (validated in app code).
 *  - optional per-milestone target date,
 *  - first-class quarters (add / remove trailing empty quarter),
 *  - explicit "who can edit" list.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('sih_roadmap_milestones', 'target_date')) {
            Schema::table('sih_roadmap_milestones', function (Blueprint $table) {
                $table->date('target_date')->nullable()->after('status');
            });
        }

        if (! Schema::hasTable('sih_roadmap_quarters')) {
            Schema::create('sih_roadmap_quarters', function (Blueprint $table) {
                $table->increments('ID');
                $table->unsignedSmallInteger('year');
                $table->unsignedTinyInteger('quarter');
                $table->unique(['year', 'quarter'], 'uq_sih_roadmap_quarter_period');
            });
        }

        if (! Schema::hasTable('sih_roadmap_editors')) {
            Schema::create('sih_roadmap_editors', function (Blueprint $table) {
                $table->increments('ID');
                $table->unsignedInteger('user_ID');
                $table->unsignedInteger('created_by');
                $table->timestamps();
                $table->unique('user_ID', 'uq_sih_roadmap_editor_user');
                $table->foreign('user_ID', 'fk_sih_roadmap_editor_user')
                    ->references('ID')
                    ->on('dynamic__users')
                    ->cascadeOnUpdate()
                    ->cascadeOnDelete();
                $table->foreign('created_by', 'fk_sih_roadmap_editor_created_by')
                    ->references('ID')
                    ->on('dynamic__users')
                    ->cascadeOnUpdate()
                    ->restrictOnDelete();
            });
        }

        // Backfill the quarters that the board already shows (published window + any milestone quarters).
        app(\App\Services\SihRoadmapService::class)->ensureQuarters();
    }

    public function down(): void
    {
        Schema::dropIfExists('sih_roadmap_editors');
        Schema::dropIfExists('sih_roadmap_quarters');

        if (Schema::hasColumn('sih_roadmap_milestones', 'target_date')) {
            Schema::table('sih_roadmap_milestones', function (Blueprint $table) {
                $table->dropColumn('target_date');
            });
        }
    }
};
