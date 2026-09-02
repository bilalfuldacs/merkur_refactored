c<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('components', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->char('SKU', 8)->nullable()->unique();
            $table->string('name', 30)->unique();
            $table->unsignedInteger('type_ID');
            $table->index('mod_by', 'mod_by');
            $table->index('type_ID', 'type');
            $table->foreign('mod_by', 'fk_components_mod_by')
                ->references('ID')
                ->on('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('type_ID', 'fk_components_type')
                ->references('ID')
                ->on('hardware_types')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('components');
    }
};
