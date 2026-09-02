<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dynamic__logins', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('when')->useCurrent();
            $table->unsignedInteger('user_ID');
            $table->string('IP', 39);
            $table->string('agent', 512);
            $table->index('user_ID', 'user');
            $table->index('when', 'when');
            $table->foreign('user_ID', 'fk_logins_user')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dynamic__logins');
    }
};
