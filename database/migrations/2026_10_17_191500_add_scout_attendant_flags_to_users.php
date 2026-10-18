<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('dynamic__users')) {
            return;
        }

        if (! Schema::hasColumn('dynamic__users', 'g2eattendent')) {
            Schema::table('dynamic__users', function (Blueprint $table) {
                $table->boolean('g2eattendent')->default(false);
            });
        }
        if (! Schema::hasColumn('dynamic__users', 'iceattendent2027')) {
            Schema::table('dynamic__users', function (Blueprint $table) {
                $table->boolean('iceattendent2027')->default(false);
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('dynamic__users')) {
            return;
        }

        Schema::table('dynamic__users', function (Blueprint $table) {
            if (Schema::hasColumn('dynamic__users', 'g2eattendent')) {
                $table->dropColumn('g2eattendent');
            }
            if (Schema::hasColumn('dynamic__users', 'iceattendent2027')) {
                $table->dropColumn('iceattendent2027');
            }
        });
    }
};
