<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users') && ! Schema::hasTable('dynamic__users')) {
            Schema::rename('users', 'dynamic__users');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('dynamic__users') && ! Schema::hasTable('users')) {
            Schema::rename('dynamic__users', 'users');
        }
    }
};
