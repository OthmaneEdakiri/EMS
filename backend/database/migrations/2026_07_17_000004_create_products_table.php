<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['product', 'service']); // no behavioral impact in MVP, avoids future migration
            $table->string('name');
            $table->unsignedBigInteger('unit_price'); // integer minor units (cents)
            $table->decimal('tax_rate', 5, 2)->nullable(); // percentage, e.g. 20.00
            $table->timestamp('archived_at')->nullable(); // soft "hide from picker" flag

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes(); // hard delete only allowed while unused; see business rules

            $table->index('tenant_id');
            $table->index(['tenant_id', 'archived_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
