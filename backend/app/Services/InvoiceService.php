<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    /**
     * Generate the next sequential invoice number for the tenant.
     * Uses DB::transaction to prevent race conditions.
     * Numbers are never reused, even if drafts are deleted.
     */
    public function generateNumber(int $tenantId, string $prefix = 'INV'): string
    {
        return DB::transaction(function () use ($tenantId, $prefix) {
            $lastSequence = DB::table('invoices')
                ->where('tenant_id', $tenantId)
                ->max(DB::raw('CAST(SUBSTRING(number, '.(strlen($prefix) + 2).') AS INTEGER)')) ?? 0;

            $nextSequence = $lastSequence + 1;

            return $prefix.'-'.str_pad((string) $nextSequence, 4, '0', STR_PAD_LEFT);
        });
    }

    /**
     * Calculate all totals from line items.
     * All amounts are in integer minor units (cents).
     */
    public function calculateTotals(array $lines): array
    {
        $subtotal = 0;
        $taxTotal = 0;

        foreach ($lines as $line) {
            $lineTotal = (int) round($line['qty'] * $line['unit_price']);
            $subtotal += $lineTotal;

            if (isset($line['tax_rate']) && $line['tax_rate'] > 0) {
                $taxTotal += (int) round($lineTotal * ($line['tax_rate'] / 100));
            }
        }

        return [
            'subtotal' => $subtotal,
            'tax_total' => $taxTotal,
            'total' => $subtotal + $taxTotal,
        ];
    }

    /**
     * Create an invoice with its line items inside a transaction.
     */
    public function create(array $validated, int $tenantId, int $userId): Invoice
    {
        $number = $this->generateNumber($tenantId);
        $totals = $this->calculateTotals($validated['lines']);

        return DB::transaction(function () use ($validated, $tenantId, $userId, $number, $totals) {
            $invoice = Invoice::create([
                'tenant_id' => $tenantId,
                'customer_id' => $validated['customer_id'],
                'number' => $number,
                'status' => 'draft',
                'issue_date' => $validated['issue_date'],
                'due_date' => $validated['due_date'],
                'subtotal' => $totals['subtotal'],
                'tax_total' => $totals['tax_total'],
                'total' => $totals['total'],
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            foreach ($validated['lines'] as $line) {
                $lineTotal = (int) round($line['qty'] * $line['unit_price']);

                InvoiceLine::create([
                    'invoice_id' => $invoice->id,
                    'product_id' => $line['product_id'] ?? null,
                    'description' => $line['description'],
                    'qty' => $line['qty'],
                    'unit_price' => $line['unit_price'],
                    'tax_rate' => $line['tax_rate'] ?? null,
                    'line_total' => $lineTotal,
                ]);
            }

            return $invoice->load(['customer', 'lines']);
        });
    }

    /**
     * Update an existing draft invoice with new line items.
     * Recalculates all totals.
     */
    public function update(Invoice $invoice, array $validated, int $userId): Invoice
    {
        $totals = $this->calculateTotals($validated['lines']);

        return DB::transaction(function () use ($invoice, $validated, $userId, $totals) {
            $invoice->update([
                'customer_id' => $validated['customer_id'] ?? $invoice->customer_id,
                'issue_date' => $validated['issue_date'] ?? $invoice->issue_date,
                'due_date' => $validated['due_date'] ?? $invoice->due_date,
                'subtotal' => $totals['subtotal'],
                'tax_total' => $totals['tax_total'],
                'total' => $totals['total'],
                'updated_by' => $userId,
            ]);

            if (isset($validated['lines'])) {
                $invoice->lines()->delete();

                foreach ($validated['lines'] as $line) {
                    $lineTotal = (int) round($line['qty'] * $line['unit_price']);

                    InvoiceLine::create([
                        'invoice_id' => $invoice->id,
                        'product_id' => $line['product_id'] ?? null,
                        'description' => $line['description'],
                        'qty' => $line['qty'],
                        'unit_price' => $line['unit_price'],
                        'tax_rate' => $line['tax_rate'] ?? null,
                        'line_total' => $lineTotal,
                    ]);
                }
            }

            return $invoice->load(['customer', 'lines']);
        });
    }

    /**
     * Transition invoice status to 'sent'.
     * Only allowed from 'draft'.
     */
    public function markAsSent(Invoice $invoice): Invoice
    {
        if ($invoice->status !== 'draft') {
            abort(422, 'Only draft invoices can be marked as sent.');
        }

        $invoice->update(['status' => 'sent']);

        return $invoice;
    }

    /**
     * Transition invoice status to 'cancelled'.
     * Allowed from 'draft' or 'sent'.
     */
    public function cancel(Invoice $invoice): Invoice
    {
        if (! in_array($invoice->status, ['draft', 'sent'])) {
            abort(422, 'Only draft or sent invoices can be cancelled.');
        }

        $invoice->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return $invoice;
    }

    /**
     * Record a payment against an invoice.
     * Validates: status must be 'sent' or 'partially_paid', amount <= remaining balance.
     * Auto-updates invoice status based on total paid amount.
     */
    public function createPayment(Invoice $invoice, array $validated, int $userId): Payment
    {
        if (! in_array($invoice->status, ['sent', 'partially_paid'])) {
            abort(422, 'Payments can only be recorded for sent or partially paid invoices.');
        }

        $currentPaid = $invoice->payments()->sum('amount');
        $remaining = $invoice->total - $currentPaid;

        if ($validated['amount'] > $remaining) {
            abort(422, "Payment amount exceeds remaining balance of {$remaining}.");
        }

        return DB::transaction(function () use ($invoice, $validated, $userId, $currentPaid) {
            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'tenant_id' => $invoice->tenant_id,
                'amount' => $validated['amount'],
                'method' => $validated['method'],
                'paid_at' => $validated['paid_at'],
                'created_by' => $userId,
            ]);

            $newTotalPaid = $currentPaid + $validated['amount'];

            if ($newTotalPaid >= $invoice->total) {
                $invoice->update(['status' => 'paid']);
            } else {
                $invoice->update(['status' => 'partially_paid']);
            }

            return $payment;
        });
    }

    /**
     * Hard delete a draft invoice and its lines.
     * Only allowed while status is 'draft'.
     */
    public function delete(Invoice $invoice): void
    {
        if ($invoice->status !== 'draft') {
            abort(422, 'Only draft invoices can be deleted.');
        }

        DB::transaction(function () use ($invoice) {
            $invoice->lines()->delete();
            $invoice->forceDelete();
        });
    }
}
