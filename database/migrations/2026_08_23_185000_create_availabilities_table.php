<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('availabilities', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('version_ID');
            $table->unsignedInteger('jurisdiction_ID');
            $table->enum('status', ['no intent', 'intent', 'availability'])->default('availability');
            $table->enum('priority', ['‼️ high', 'standard', '⬇️ low'])->default('standard');
            $table->string('comment', 140)->nullable();
            $table->unique(['version_ID', 'jurisdiction_ID'], 'version-jurisdiction');
            $table->index('jurisdiction_ID', 'jurisdiction');
            $table->index('mod_by', 'mod_by');
            $table->foreign('mod_by', 'fk_availabilities_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('version_ID', 'fk_availabilities_version')
                ->references('ID')
                ->on('versions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('jurisdiction_ID', 'fk_availabilities_jurisdiction')
                ->references('ID')
                ->on('jurisdictions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('availabilities');
    }
};
