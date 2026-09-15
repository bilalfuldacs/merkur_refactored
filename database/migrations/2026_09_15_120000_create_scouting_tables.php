<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('scout_events')) {
            Schema::create('scout_events', function (Blueprint $table) {
                $table->increments('ID');
                $table->string('slug', 32)->unique('uq_scout_event_slug');
                $table->string('name', 80);
                $table->unsignedSmallInteger('year')->nullable();
                $table->string('icon', 40)->default('fa-binoculars');
                $table->boolean('active')->default(true);
                $table->integer('sort_order')->default(0);
                $table->dateTime('created_at')->useCurrent();
            });
        }

        if (! Schema::hasTable('scout_attendants')) {
            Schema::create('scout_attendants', function (Blueprint $table) {
                $table->increments('ID');
                $table->unsignedInteger('event_ID');
                $table->unsignedInteger('user_ID');
                $table->boolean('may_manage')->default(false);
                $table->unique(['event_ID', 'user_ID'], 'uq_scout_attendant');
                $table->index('user_ID', 'idx_scout_attendant_user');
                $table->foreign('event_ID', 'fk_scout_attendant_event')
                    ->references('ID')
                    ->on('scout_events')
                    ->cascadeOnDelete();
                $table->foreign('user_ID', 'fk_scout_attendant_user')
                    ->references('ID')
                    ->on('dynamic__users')
                    ->cascadeOnDelete();
            });
        }

        $now = now();
        foreach ([
            ['slug' => 'ice2027', 'name' => 'ICE 2027', 'year' => 2027, 'icon' => 'fa-igloo', 'sort_order' => 1],
            ['slug' => 'g2e', 'name' => 'G2E', 'year' => 2026, 'icon' => 'fa-globe', 'sort_order' => 2],
        ] as $event) {
            if (! DB::table('scout_events')->where('slug', $event['slug'])->exists()) {
                DB::table('scout_events')->insert([
                    ...$event,
                    'active' => 1,
                    'created_at' => $now,
                ]);
            }
        }

        $iceId = (int) DB::table('scout_events')->where('slug', 'ice2027')->value('ID');
        $g2eId = (int) DB::table('scout_events')->where('slug', 'g2e')->value('ID');

        foreach (['ice2027_teams', 'ice2027_team_members', 'ice2027_competitors', 'ice2027_evaluations'] as $table) {
            if (Schema::hasTable($table) && ! Schema::hasColumn($table, 'event_ID')) {
                Schema::table($table, function (Blueprint $blueprint) use ($table) {
                    $blueprint->unsignedInteger('event_ID')->nullable()->after('ID');
                    $blueprint->index('event_ID', 'idx_'.$table.'_event_id');
                });
            }
        }

        if (Schema::hasTable('ice2027_teams') && Schema::hasColumn('ice2027_teams', 'event_ID')) {
            DB::table('ice2027_teams')->whereNull('event_ID')->update(['event_ID' => $iceId]);
        }
        if (Schema::hasTable('ice2027_team_members') && Schema::hasColumn('ice2027_team_members', 'event_ID')) {
            DB::table('ice2027_team_members')->whereNull('event_ID')->update(['event_ID' => $iceId]);
        }
        if (Schema::hasTable('ice2027_competitors') && Schema::hasColumn('ice2027_competitors', 'event_ID')) {
            DB::table('ice2027_competitors')->whereNull('event_ID')->update(['event_ID' => $iceId]);
        }
        if (Schema::hasTable('ice2027_evaluations') && Schema::hasColumn('ice2027_evaluations', 'event_ID')) {
            DB::table('ice2027_evaluations')->whereNull('event_ID')->update(['event_ID' => $iceId]);
        }

        $this->replaceUniqueIndex(
            'ice2027_team_members',
            'uq_ice2027_member_user',
            'uq_scout_member_user_event_id',
            ['user_ID', 'event_ID'],
            'fk_ice2027_member_user',
        );
        $this->replaceUniqueIndex(
            'ice2027_evaluations',
            'uq_ice2027_evaluation_user',
            'uq_scout_evaluation_user_event_id',
            ['user_ID', 'event_ID'],
            'fk_ice2027_e_user',
        );

        if (Schema::hasTable('dynamic__users') && Schema::hasColumn('dynamic__users', 'iceattendent2027') && $iceId > 0) {
            DB::statement(
                'INSERT IGNORE INTO scout_attendants (event_ID, user_ID, may_manage)
                 SELECT ?, ID, 0 FROM dynamic__users WHERE iceattendent2027 = 1 AND active = 1',
                [$iceId]
            );
        }

        if (! Schema::hasTable('scout_questionnaires')) {
            Schema::create('scout_questionnaires', function (Blueprint $table) {
                $table->increments('ID');
                $table->unsignedInteger('event_ID');
                $table->unsignedInteger('team_ID');
                $table->unsignedInteger('competitor_ID');
                $table->longText('payload');
                $table->unsignedInteger('updated_by');
                $table->dateTime('updated_at')->useCurrent();
                $table->unique(['event_ID', 'team_ID', 'competitor_ID'], 'uq_scout_questionnaire');
                $table->index('team_ID', 'idx_scout_q_team');
                $table->index('competitor_ID', 'idx_scout_q_competitor');
                $table->foreign('event_ID', 'fk_scout_q_event')
                    ->references('ID')
                    ->on('scout_events')
                    ->cascadeOnDelete();
                $table->foreign('team_ID', 'fk_scout_q_team')
                    ->references('ID')
                    ->on('ice2027_teams')
                    ->cascadeOnDelete();
                $table->foreign('competitor_ID', 'fk_scout_q_competitor')
                    ->references('ID')
                    ->on('ice2027_competitors')
                    ->cascadeOnDelete();
                $table->foreign('updated_by', 'fk_scout_q_user')
                    ->references('ID')
                    ->on('dynamic__users')
                    ->cascadeOnDelete();
            });
        }

        if (! Schema::hasTable('scout_questionnaire_history')) {
            Schema::create('scout_questionnaire_history', function (Blueprint $table) {
                $table->increments('ID');
                $table->unsignedInteger('questionnaire_ID');
                $table->unsignedInteger('user_ID');
                $table->longText('payload');
                $table->dateTime('saved_at')->useCurrent();
                $table->index('questionnaire_ID', 'idx_scout_qh_questionnaire');
                $table->foreign('questionnaire_ID', 'fk_scout_qh_q')
                    ->references('ID')
                    ->on('scout_questionnaires')
                    ->cascadeOnDelete();
                $table->foreign('user_ID', 'fk_scout_qh_user')
                    ->references('ID')
                    ->on('dynamic__users')
                    ->cascadeOnDelete();
            });
        }

        unset($g2eId);
    }

    /**
     * @param  list<string>  $columns
     */
    private function replaceUniqueIndex(string $table, string $old, string $new, array $columns, string $foreignKey): void
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'event_ID')) {
            return;
        }

        $indexes = collect(DB::select('SHOW INDEX FROM `'.$table.'`'));
        $names = $indexes->pluck('Key_name')->unique()->all();
        $foreignExists = $this->hasForeignKey($table, $foreignKey);

        if (in_array($old, $names, true)) {
            if ($foreignExists) {
                Schema::table($table, function (Blueprint $blueprint) use ($foreignKey) {
                    $blueprint->dropForeign($foreignKey);
                });
                $foreignExists = false;
            }
            Schema::table($table, function (Blueprint $blueprint) use ($old) {
                $blueprint->dropUnique($old);
            });
        }

        $indexes = collect(DB::select('SHOW INDEX FROM `'.$table.'`'));
        $names = $indexes->pluck('Key_name')->unique()->all();

        if (! in_array($new, $names, true)) {
            Schema::table($table, function (Blueprint $blueprint) use ($new, $columns) {
                $blueprint->unique($columns, $new);
            });
        }

        if (! $foreignExists) {
            Schema::table($table, function (Blueprint $blueprint) use ($foreignKey) {
                $blueprint->foreign('user_ID', $foreignKey)
                    ->references('ID')
                    ->on('dynamic__users')
                    ->cascadeOnDelete();
            });
        }
    }

    private function hasForeignKey(string $table, string $name): bool
    {
        return collect(DB::select(
            'SELECT CONSTRAINT_NAME
             FROM information_schema.TABLE_CONSTRAINTS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND CONSTRAINT_TYPE = ?
               AND CONSTRAINT_NAME = ?',
            [$table, 'FOREIGN KEY', $name]
        ))->isNotEmpty();
    }

    public function down(): void
    {
        Schema::dropIfExists('scout_questionnaire_history');
        Schema::dropIfExists('scout_questionnaires');
        Schema::dropIfExists('scout_attendants');
        Schema::dropIfExists('scout_events');
    }
};
