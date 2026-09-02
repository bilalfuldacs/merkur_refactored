<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('config__roles')) {
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

        Schema::create('dynamic__users', function (Blueprint $table) {
            $table->increments('ID');
            $table->string('initials', 3)->unique();
            $table->string('name_COMBINED', 200)
                ->storedAs("concat_ws(', ', `lastname`, `firstname`, `prefix`)");
            $table->boolean('active');
            $table->string('lastname', 30);
            $table->string('firstname', 30);
            $table->string('prefix', 15)->nullable();
            $table->string('username', 50)->unique();
            $table->string('password', 255);
            $table->char('bcolor', 7)->nullable();
            $table->char('color', 7)->nullable();
            $table->unsignedInteger('role_ID');
            $table->boolean('beta');
            $table->string('jobtitle', 140);
            $table->date('birthday')->nullable();
            $table->boolean('decolorize_avatars')->default(false);
            $table->enum('appearance', ['auto', 'light', 'dark'])->default('auto');
            $table->enum('notifications', ['off', 'daily', 'weekly'])->default('off');
            $table->timestamp('last_ads_mail_timestamp')->nullable();
            $table->index('role_ID', 'role');
            $table->foreign('role_ID', 'users_role')
                ->references('ID')
                ->on('config__roles')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dynamic__users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('config__roles');
    }
};
