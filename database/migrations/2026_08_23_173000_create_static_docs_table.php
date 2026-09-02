<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('static__docs', function (Blueprint $table) {
            $table->integer('id')->primary();
            $table->string('title', 255);
            $table->string('subfolder', 255);
            $table->string('file', 255);
            $table->boolean('is_complete')->nullable()->default(false);
            $table->text('description')->nullable();
            $table->integer('file_size');
            $table->dateTime('upload_date')->nullable()->useCurrent();
            $table->index('is_complete', 'idx_complete');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('static__docs');
    }
};
