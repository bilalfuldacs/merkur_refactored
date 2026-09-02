<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('config__tables', function (Blueprint $table) {
            $table->unsignedInteger('ID')->primary();
            $table->string('group', 50)->nullable();
            $table->string('table', 40)->unique();
            $table->string('title', 50)->nullable();
            $table->string('item_name', 30);
            $table->string('icon', 50)->nullable();
            $table->char('color', 7);
            $table->string('short_description', 280);
            $table->text('infobox');
            $table->enum('table_type', ['standard', 'secondary', 'system', '']);
            $table->boolean('has_history')->default(false);
            $table->boolean('has_section_metadata')->default(false);
            $table->boolean('in_global_search')->default(true);
            $table->boolean('in_launchpad');
            $table->boolean('change_report')->default(true);
            $table->string('link_column', 40)->nullable();
            $table->string('info_column', 40);
            $table->string('view', 80)->nullable();
            $table->string('default_view_columns', 250);
            $table->string('default_view_order', 40);
            $table->string('default_view_name', 40);
            $table->string('edit_extras', 40)->nullable();
            $table->string('collapse_item', 30)->nullable();
            $table->enum('has_backlink', ['none', 'panorama', 'market'])->default('none');
            $table->string('search_preview_columns', 250);
            $table->string('search_preview_format', 300)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('config__tables');
    }
};
