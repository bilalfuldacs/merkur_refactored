<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resolutions', function (Blueprint $table) {
            $table->increments('ID');
            $table->string('name', 40)->unique();
            $table->enum('orientation', ['landscape', 'portrait']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resolutions');
    }
};
