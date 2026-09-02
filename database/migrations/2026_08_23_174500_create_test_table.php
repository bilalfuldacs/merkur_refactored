<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('test', function (Blueprint $table) {
            $table->increments('ID');
            $table->timestamp('mod_date')->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('mod_by');
            $table->string('varchar_40_NOT_NULL', 40);
            $table->string('varchar_100', 100)->nullable();
            $table->string('link_TLP:RED', 250)->nullable();
            $table->string('geo_link', 250)->nullable();
            $table->text('text_with_#_in_its_name')->nullable();
            $table->boolean('boolean')->nullable();
            $table->integer('integer')->nullable();
            $table->decimal('decimal_10,_2', 10, 2)->nullable();
            $table->float('float')->nullable();
            $table->char('color', 7)->nullable();
            $table->enum('traffic_light', ['red', 'yellow', 'green'])->nullable();
            $table->unsignedTinyInteger('status_indicator')->nullable();
            $table->date('date')->nullable();
            $table->longText('matrix')->nullable();
            $table->enum('enum', ['foo', 'bar', 'foobar', 'baz', 'qux', 'quux'])->nullable();
            $table->unsignedInteger('foreign_key_ID')->nullable();
            $table->unsignedInteger('foreign_key_go_ID')->nullable();
            $table->unsignedInteger('another_test_item_ID')->nullable();
            $table->boolean('tags')->nullable()->virtualAs('NULL');
            $table->json('attributes')->nullable();
            $table->index('mod_by', 'mod_by');
            $table->index('foreign_key_ID', 'fk_test_foreign_key');
            $table->index('foreign_key_go_ID', 'fk_test_foreign_key_go');
            $table->index('another_test_item_ID', 'fk_test_another_test_item');
            $table->fullText('text_with_#_in_its_name', 'text');
            $table->foreign('mod_by', 'fk_test_mod_by')
                ->references('ID')
                ->on('dynamic__users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('foreign_key_ID', 'fk_test_foreign_key')
                ->references('ID')
                ->on('platforms')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign('another_test_item_ID', 'fk_test_another_test_item')
                ->references('ID')
                ->on('test')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('test');
    }
};
