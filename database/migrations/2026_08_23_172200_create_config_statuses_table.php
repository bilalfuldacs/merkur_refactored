<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('config__statuses', function (Blueprint $table) {
            $table->unsignedInteger('ID')->primary();
            $table->string('name', 40);
            $table->char('color', 7);
            $table->char('text_color', 7)->default('#ffffff');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('config__statuses');
    }
};
