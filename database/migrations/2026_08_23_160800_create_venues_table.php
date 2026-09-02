<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('venues', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('partner_ID')->nullable();
            $table->string('name', 100);
            $table->unsignedInteger('jurisdiction_ID')->nullable();
            $table->boolean('active')->default(true);
            $table->string('location', 30)->nullable();
            $table->string('street_address', 50)->nullable();
            $table->string('city', 40)->nullable();
            $table->string('province', 40)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->unique(['partner_ID', 'name'], 'partner-name');
            $table->index('mod_by', 'mod_by');
            $table->index('jurisdiction_ID', 'jurisdiction');
            $table->foreign('mod_by', 'fk_venues_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('partner_ID', 'fk_venues_partner')
                ->references('ID')
                ->on('partners')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('jurisdiction_ID', 'fk_venues_jurisdiction')
                ->references('ID')
                ->on('jurisdictions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('venues');
    }
};
