<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('scout_themes')) {
            return;
        }

        Schema::create('scout_themes', function (Blueprint $table) {
            $table->unsignedInteger('event_ID');
            $table->string('theme', 150);
            $table->unsignedInteger('created_by')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->primary(['event_ID', 'theme']);
            $table->foreign('event_ID', 'fk_scout_theme_event')
                ->references('ID')
                ->on('scout_events')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scout_themes');
    }
};
