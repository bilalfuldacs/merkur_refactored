<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dongles', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->string('name', 40);
            $table->unsignedInteger('version_ID');
            $table->string('name2', 80);
            $table->unsignedInteger('jurisdiction_ID');
            $table->string('salesforce_URL', 250)->nullable();
            $table->index('mod_by', 'mod_by');
            $table->index('version_ID', 'version');
            $table->index('jurisdiction_ID', 'jurisdiction');
            $table->foreign('mod_by', 'fk_dongles_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('version_ID', 'fk_dongles_version')
                ->references('ID')
                ->on('versions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('jurisdiction_ID', 'fk_dongles_jurisdiction')
                ->references('ID')
                ->on('jurisdictions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dongles');
    }
};
