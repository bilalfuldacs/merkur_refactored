<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('versions', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->string('name', 20)->unique();
            $table->string('name2', 40)->nullable();
            $table->string('subtitle', 80)->nullable();
            $table->unsignedInteger('platform_ID');
            $table->unsignedInteger('status_ID')->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('inherits_ID')->nullable();
            $table->boolean('feat_in_products_pano')->default(false);
            $table->boolean('feat_in_instl_feedback')->default(false);
            $table->string('dev_URL', 255)->nullable();
            $table->unique(['ID', 'platform_ID'], 'ID');
            $table->index('status_ID', 'status');
            $table->index('mod_by', 'mod_by');
            $table->index('inherits_ID', 'inherits');
            $table->index('platform_ID', 'fk_versions_platforms');
            $table->foreign('mod_by', 'fk_versions_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('platform_ID', 'fk_versions_platforms')
                ->references('ID')
                ->on('platforms')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('status_ID', 'fk_versions_status')
                ->references('ID')
                ->on('config__statuses')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('inherits_ID', 'fk_versions_inherits')
                ->references('ID')
                ->on('versions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });

        DB::statement("ALTER TABLE versions ADD `name_SORT` varchar(80) AS (regexp_replace(regexp_replace(`name`,'(^|\\\\.)(\\\\d+)','\\\\100000\\\\2'),'0+(\\\\d{5})(\\\\.|\\\\s|$)','\\\\1\\\\2')) STORED AFTER `name`");
        DB::statement("ALTER TABLE versions ADD `name_name2_COMBINED` varchar(80) AS (concat_ws(' ',`name`,`name2`)) STORED AFTER `name2`");
        DB::statement('ALTER TABLE versions ADD INDEX `name_SORT` (`name_SORT`)');
    }

    public function down(): void
    {
        Schema::dropIfExists('versions');
    }
};
