<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teams', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->string('name', 40);
            $table->string('color', 7)->nullable();
            $table->enum('type', [
                'Product Organization',
                'Studio (Game Design)',
                '3rd Party',
            ]);
            $table->string('website', 40)->nullable();
            $table->unsignedInteger('primary_contact_ID')->nullable();
            $table->unique(['name', 'type'], 'name-type');
            $table->index('mod_by', 'mod_by');
            $table->foreign('mod_by', 'fk_studios_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('primary_contact_ID', 'fk_teams_primary_contact')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teams');
    }
};
