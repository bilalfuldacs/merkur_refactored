<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('config__roles')) {
            return;
        }

        Schema::create('config__roles', function (Blueprint $table) {
            $table->increments('ID');
            $table->string('name', 50)->unique();
            $table->string('description', 280);
            $table->boolean('needs_subscriptions')->default(false);
            $table->boolean('may_create-update_items');
            $table->boolean('may_delete_items');
            $table->boolean('may_create-update-delete_system-items');
            $table->boolean('may_use_tlp-red');
            $table->boolean('may_access_unsubscribed-markets');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('config__roles');
    }
};
