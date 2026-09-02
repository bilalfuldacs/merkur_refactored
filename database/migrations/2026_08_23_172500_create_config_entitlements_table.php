<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('config__entitlements', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent();
            $table->unsignedInteger('mod_by');
            $table->string('table', 30)->nullable();
            $table->unsignedInteger('role_ID');
            $table->text('note')->nullable();
            $table->index('mod_by', 'mod_by');
            $table->index('table', 'table-item');
            $table->index('role_ID', 'fk_entitlements_role');
            $table->fullText('note', 'note');
            $table->foreign('mod_by', 'fk_entitlements_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('role_ID', 'fk_entitlements_role')
                ->references('ID')
                ->on('config__roles')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('config__entitlements');
    }
};
