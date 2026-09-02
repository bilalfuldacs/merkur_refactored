<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cabinets', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->string('name', 30)->unique();
            $table->string('code', 10)->unique();
            $table->enum('form_factor', ['Slant', 'Upright']);
            $table->string('tagline', 50)->nullable();
            $table->text('blurb');
            $table->index('mod_by', 'mod_by');
            $table->foreign('mod_by', 'fk_cabinets_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cabinets');
    }
};
