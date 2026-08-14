<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_id')->constrained()->restrictOnDelete();

            $table->unsignedBigInteger('amount'); // integer minor units
            $table->string('method'); // e.g. cash, bank_transfer, card, check
            $table->date('paid_at');

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            // Data model only specifies created_at (no updated_at) — payments are
            // immutable financial records and can never be deleted or edited in MVP.
            $table->timestamp('created_at')->useCurrent();

            $table->index('tenant_id');
            $table->index('invoice_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
