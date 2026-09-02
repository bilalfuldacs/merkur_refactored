<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_activities', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->unsignedInteger('jurisdiction_ID');
            $table->unsignedInteger('partner_ID');
            $table->boolean('key_customer');
            $table->integer('total_machines')->nullable();
            $table->string('share_of_mfrs', 200)->nullable();
            $table->integer('total_online_games')->nullable();
            $table->integer('merkur_online_games')->nullable();
            $table->unique(['jurisdiction_ID', 'partner_ID'], 'jurisdiction');
            $table->index('mod_by', 'mod_by');
            $table->index('partner_ID', 'partner');
            $table->foreign('mod_by', 'fk_partner_activities_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('jurisdiction_ID', 'fk_partner_activities_jurisdiction')
                ->references('ID')
                ->on('jurisdictions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('partner_ID', 'fk_partner_activities_partner')
                ->references('ID')
                ->on('partners')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_activities');
    }
};
