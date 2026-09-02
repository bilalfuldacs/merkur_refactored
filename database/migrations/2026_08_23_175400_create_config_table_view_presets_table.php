<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('config__table-view-presets', function (Blueprint $table) {
            $table->increments('ID');
            $table->unsignedInteger('table_ID');
            $table->string('name', 40);
            $table->string('parameters', 1000);
            $table->index('table_ID', 'table');
            $table->index('name', 'name');
            $table->foreign('table_ID', 'fk_table_view_presets_table')
                ->references('ID')
                ->on('config__tables')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('config__table-view-presets');
    }
};
