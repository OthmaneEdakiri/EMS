<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();

            // Sequential per-tenant number (e.g. INV-0001), generated from a counter
            // that only increments and is never reused, even if the invoice is deleted.
            $table->string('number');

            $table->enum('status', ['draft', 'sent', 'partially_paid', 'paid', 'cancelled'])
                ->default('draft');
            // Note: "overdue" is derived at read time from due_date + status, never stored.

            $table->date('issue_date');
            $table->date('due_date');

            $table->unsignedBigInteger('subtotal')->default(0); // integer minor units
            $table->unsignedBigInteger('tax_total')->default(0);
            $table->unsignedBigInteger('total')->default(0);

            $table->timestamp('cancelled_at')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes(); // hard delete only allowed while status = draft (enforced in service layer)

            // Invoice numbers are unique and immutable per tenant.
            $table->unique(['tenant_id', 'number']);
            $table->index(['tenant_id', 'status']);
            $table->index('customer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
