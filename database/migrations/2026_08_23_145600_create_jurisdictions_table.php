<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jurisdictions', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->string('name', 50)->unique();
            $table->string('name_english', 50)->unique();
            $table->string('iso3166', 10);
            $table->unsignedInteger('parent_ID')->nullable();
            $table->string('flag', 5);
            $table->char('color', 7)->nullable();
            $table->string('short_name_COMBINED', 50)
                ->storedAs("concat(`iso3166`,' ',`flag`,' ',`segment_name`)");
            $table->string('long_name_COMBINED', 80)
                ->storedAs("concat(`iso3166`,' ',`flag`,' ',`name_english`)");
            $table->string('game_languages', 40)->nullable();
            $table->enum('segment', ['land-based', 'online']);
            $table->string('segment_name', 10);
            $table->string('currency_name_english', 50);
            $table->char('iso4217', 3);
            $table->string('currency_symbol', 5);
            $table->enum('symbol_position', ['prefix', 'postfix'])->nullable();
            $table->enum('separators', ['123,456.78', '123.456,78'])->nullable();
            $table->unsignedInteger('authority_ID')->nullable();
            $table->boolean('xfer_letter_reqd')->nullable();
            $table->string('denominations', 40)->nullable();
            $table->string('min_bet', 20)->nullable();
            $table->string('max_bet', 20)->nullable();
            $table->string('min_RTP', 20)->nullable();
            $table->string('max_BG_win', 20)->nullable();
            $table->string('max_JP_win', 80)->nullable();
            $table->string('min_reel_run_time', 20)->nullable();
            $table->enum('auto_start', ['forbidden', 'allowed', 'mandatory', ''])->nullable();
            $table->boolean('gamble')->nullable();
            $table->string('dev_URL_HW', 250)->nullable();
            $table->string('dev_URL_SW', 250)->nullable();
            $table->text('comment')->nullable();
            $table->json('attributes')->nullable();
            $table->unique(['iso3166', 'segment', 'segment_name'], 'iso3166-segment-subsegment');
            $table->index('mod_by', 'mod_by');
            $table->index('authority_ID', 'authority_ID');
            $table->index('parent_ID', 'parent_ID');
            $table->index('segment', 'segment');
            $table->index('iso4217', 'iso-4217');
            $table->foreign('mod_by', 'fk_jurisdictions_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('parent_ID', 'fk_jurisdictions_parent')
                ->references('ID')
                ->on('jurisdictions')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('authority_ID', 'fk_jurisdictions_authority')
                ->references('ID')
                ->on('authorities')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jurisdictions');
    }
};
