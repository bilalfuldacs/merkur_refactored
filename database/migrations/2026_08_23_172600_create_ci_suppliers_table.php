<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ci_suppliers', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->string('short_name', 40)->unique();
            $table->string('name', 50)->nullable()->unique();
            $table->string('website', 50)->nullable();
            $table->text('comment')->nullable();
            $table->index('mod_by', 'mod_by');
            $table->foreign('mod_by', 'fk_ci_suppliers_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ci_suppliers');
    }
};
