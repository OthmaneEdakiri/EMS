<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->char('currency', 3); // ISO 4217 code, e.g. MAD, EUR, USD
            $table->unsignedTinyInteger('currency_decimal_places')->default(2); // 2 for MAD/EUR/USD, 0 for JPY
            $table->string('locale', 5)->default('en'); // en | ar
            $table->string('invoice_prefix')->default('INV');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
