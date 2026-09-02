<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('features', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->char('ID_text', 4)->nullable()->unique();
            $table->string('name', 100);
            $table->unsignedInteger('version_ID')->nullable();
            $table->string('dev_URL', 255)->nullable();
            $table->text('description')->nullable();
            $table->index('name', 'name');
            $table->index('mod_by', 'mod_by');
            $table->index('version_ID', 'version');
            $table->foreign('mod_by', 'fk_features_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('version_ID', 'fk_features_version')
                ->references('ID')
                ->on('versions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('features');
    }
};
