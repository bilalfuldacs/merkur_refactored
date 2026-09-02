<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('strat_features', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->string('name', 50)->unique();
            $table->unsignedInteger('variant_of_ID')->nullable();
            $table->boolean('components')->nullable()->virtualAs('NULL');
            $table->text('description')->nullable();
            $table->index('mod_by', 'mod_by');
            $table->index('variant_of_ID', 'parent');
            $table->foreign('mod_by', 'fk_strat_features_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('variant_of_ID', 'fk_strat_features_variant_of')
                ->references('ID')
                ->on('strat_features')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('strat_features');
    }
};
