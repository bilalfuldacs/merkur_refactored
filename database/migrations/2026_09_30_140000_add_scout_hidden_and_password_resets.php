<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('ice2027_competitors') && ! Schema::hasColumn('ice2027_competitors', 'hidden')) {
            Schema::table('ice2027_competitors', function (Blueprint $table) {
                $table->boolean('hidden')->default(false)->after('team_ID');
            });
        }

        if (! Schema::hasTable('dynamic__password_resets')) {
            Schema::create('dynamic__password_resets', function (Blueprint $table) {
                $table->increments('ID');
                $table->unsignedInteger('user_ID');
                $table->char('token_hash', 64);
                $table->dateTime('expires_at');
                $table->dateTime('used_at')->nullable();
                $table->dateTime('created_at')->useCurrent();
                $table->string('request_ip', 45)->nullable();
                $table->unique('token_hash', 'uq_password_reset_token');
                $table->index(['user_ID', 'created_at'], 'idx_password_reset_user');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('dynamic__password_resets');
        if (Schema::hasTable('ice2027_competitors') && Schema::hasColumn('ice2027_competitors', 'hidden')) {
            Schema::table('ice2027_competitors', function (Blueprint $table) {
                $table->dropColumn('hidden');
            });
        }
    }
};
