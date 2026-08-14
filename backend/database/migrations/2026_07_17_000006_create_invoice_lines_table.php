<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->restrictOnDelete();

            $table->string('description'); // pre-filled from product, editable
            $table->decimal('qty', 12, 2);
            $table->unsignedBigInteger('unit_price'); // integer minor units, editable per line
            $table->decimal('tax_rate', 5, 2)->nullable(); // defaults to tenant rate, can be 0
            $table->unsignedBigInteger('line_total'); // integer minor units

            $table->timestamps();
            // No tenant_id here by design — tenant scoping is inherited via invoice_id.
            // No soft deletes — lines are immutable once the parent invoice is sent
            // (see business rules); editing is only allowed while the invoice is draft.

            $table->index('invoice_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_lines');
    }
};
