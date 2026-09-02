<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('static__docs', function (Blueprint $table) {
            $table->unsignedInteger('mod_by')->nullable()->after('id');
        });

        $creatorId = DB::table('dynamic__users')->where('ID', 1)->value('ID')
            ?? DB::table('dynamic__users')->orderBy('ID')->value('ID');

        if ($creatorId !== null) {
            DB::table('static__docs')->whereNull('mod_by')->update(['mod_by' => $creatorId]);
        }

        DB::statement('ALTER TABLE static__docs MODIFY mod_by int(10) unsigned NOT NULL');
        DB::statement('ALTER TABLE static__docs MODIFY subfolder varchar(255) NULL');
        DB::statement('ALTER TABLE static__docs MODIFY file varchar(255) NULL');
        DB::statement('ALTER TABLE static__docs MODIFY file_size int(11) NULL');
        DB::statement('ALTER TABLE static__docs MODIFY is_complete tinyint(1) NULL DEFAULT NULL');
        DB::statement('ALTER TABLE static__docs MODIFY id int(11) NOT NULL AUTO_INCREMENT');

        Schema::table('static__docs', function (Blueprint $table) {
            $table->index('mod_by', 'docs_mod_by');
            $table->foreign('mod_by', 'fk_docs_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('static__docs', function (Blueprint $table) {
            $table->dropForeign('fk_docs_mod_by');
            $table->dropIndex('docs_mod_by');
            $table->dropColumn('mod_by');
        });
    }
};
