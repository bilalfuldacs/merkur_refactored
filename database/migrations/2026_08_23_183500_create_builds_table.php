<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('builds', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('version_ID');
            $table->unsignedInteger('jurisdiction_ID')->nullable();
            $table->string('name', 25)->unique();
            $table->unsignedInteger('status_ID');
            $table->string('comment', 140)->nullable();
            $table->string('p_label', 40)->nullable();
            $table->string('checksum_system', 40)->nullable();
            $table->string('checksum_verify', 40)->nullable();
            $table->string('checksum_app', 40)->nullable();
            $table->index('version_ID', 'version');
            $table->index('jurisdiction_ID', 'jurisdiction');
            $table->index('status_ID', 'status');
            $table->index('mod_by', 'mod_by');
            $table->foreign('mod_by', 'fk_builds_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('version_ID', 'fk_builds_version')
                ->references('ID')
                ->on('versions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('jurisdiction_ID', 'fk_builds_jurisdiction')
                ->references('ID')
                ->on('jurisdictions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('status_ID', 'fk_builds_status')
                ->references('ID')
                ->on('config__statuses')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });

        DB::statement("ALTER TABLE builds ADD `name_SORT` varchar(80) AS (regexp_replace(regexp_replace(`name`,'(^|\\\\.)(\\\\d+)','\\\\100000\\\\2'),'0+(\\\\d{5})(\\\\.|\\\\s|$)','\\\\1\\\\2')) STORED AFTER `name`");
        DB::statement('ALTER TABLE builds ADD INDEX `name_SORT` (`name_SORT`)');
    }

    public function down(): void
    {
        Schema::dropIfExists('builds');
    }
};
