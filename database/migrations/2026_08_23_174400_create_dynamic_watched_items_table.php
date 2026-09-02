<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dynamic__watched_items', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent();
            $table->unsignedInteger('mod_by');
            $table->string('table', 30)->nullable();
            $table->unsignedInteger('item_ID')->nullable();
            $table->enum('status', ['inactive', 'bookmarked', 'watched'])->default('inactive');
            $table->index('mod_by', 'mod_by');
            $table->index(['table', 'item_ID'], 'table-item');
            $table->foreign('mod_by', 'fk_watched_items_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dynamic__watched_items');
    }
};
