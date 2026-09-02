<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stakes_jurisdictions', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('person_ID');
            $table->unsignedInteger('jurisdiction_ID');
            $table->boolean('as_deputy')->default(false);
            $table->unique(['person_ID', 'jurisdiction_ID'], 'person-jurisdiction');
            $table->index('jurisdiction_ID', 'jurisdiction');
            $table->index('mod_by', 'mod_by');
            $table->foreign('mod_by', 'fk_stakes_jurisdictions_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('person_ID', 'fk_stakes_jurisdictions_person')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('jurisdiction_ID', 'fk_stakes_jurisdictions_jurisdiction')
                ->references('ID')
                ->on('jurisdictions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stakes_jurisdictions');
    }
};
