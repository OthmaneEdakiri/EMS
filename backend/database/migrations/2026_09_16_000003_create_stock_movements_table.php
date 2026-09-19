<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['opening_balance', 'sale', 'cancellation_reversal', 'adjustment']);
            $table->integer('quantity_delta'); // signed: positive = stock in, negative = stock out
            $table->string('reference_type')->nullable(); // 'invoice' | null
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('reason')->nullable(); // required at app layer when type = adjustment
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index('tenant_id');
            $table->index('product_id');
            $table->index(['tenant_id', 'product_id']);
            $table->index(['reference_type', 'reference_id']);
        });

        DB::statement('
            CREATE UNIQUE INDEX stock_movements_reference_unique
            ON stock_movements (tenant_id, product_id, reference_type, reference_id, type)
            WHERE reference_type IS NOT NULL
        ');
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
