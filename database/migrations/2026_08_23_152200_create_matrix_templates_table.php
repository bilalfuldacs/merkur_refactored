<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('matrix_templates', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->string('table', 40);
            $table->string('column', 40);
            $table->string('table_column_COMBINED', 85)
                ->storedAs("concat_ws('.', `table`, `column`)");
            $table->json('template')->nullable();
            $table->boolean('active')->default(true);
            $table->text('description')->nullable();
            $table->unique(['table', 'column'], 'table-column');
            $table->index('mod_by', 'fk_matrix_templates_mod_by');
            $table->foreign('mod_by', 'fk_matrix_templates_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matrix_templates');
    }
};
