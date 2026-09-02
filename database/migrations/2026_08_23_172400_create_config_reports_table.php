<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('config__reports', function (Blueprint $table) {
            $table->unsignedInteger('ID')->primary();
            $table->string('group', 50)->nullable();
            $table->string('name', 30)->unique();
            $table->string('title', 50);
            $table->string('icon', 50)->nullable();
            $table->char('color', 7);
            $table->string('short_description', 280);
            $table->boolean('in_launchpad')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('config__reports');
    }
};
