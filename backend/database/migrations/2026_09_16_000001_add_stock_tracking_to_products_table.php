<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('track_stock')->default(false);
            $table->integer('quantity_on_hand')->default(0);
            $table->integer('reorder_level')->nullable();
        });

        DB::statement('ALTER TABLE products ADD CONSTRAINT reorder_level_check CHECK (reorder_level IS NULL OR reorder_level >= 0)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE products DROP CONSTRAINT IF EXISTS reorder_level_check');

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['track_stock', 'quantity_on_hand', 'reorder_level']);
        });
    }
};
